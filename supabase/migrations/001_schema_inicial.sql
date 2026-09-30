-- ============================================================
-- Migração 001 — Esquema inicial do Site Químicos SJC
-- Data: 29/09/2026
-- Baseado no Documento Mestre e nos Contratos Técnicos (03-Contratos-Tecnicos.md)
--
-- COMO EXECUTAR: cole este arquivo no Editor SQL do Supabase
-- (supabase.com → seu projeto → SQL Editor)
-- ============================================================

-- Ativar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CONFIGURAÇÕES DO SITE
-- Tabela central de configurações: links, contatos, e-mails padrão etc.
-- ============================================================
CREATE TABLE site_config (
  chave       TEXT PRIMARY KEY,
  valor       JSONB NOT NULL,
  atualizado  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações iniciais conforme Documento Mestre
INSERT INTO site_config (chave, valor) VALUES
  ('timezone',              '"America/Sao_Paulo"'),
  ('pagina_tamanho',        '20'),
  ('autosave_servidor_seg', '30'),
  ('autosave_local_seg',    '5'),
  ('lixeira_retencao_dias', '60'),
  ('backup_retencao_dias',  '60'),
  ('mensagem_sucesso',      '"Formulário enviado com sucesso"'),
  ('destinatarios_forms', '{
    "sindicalizacao": "contato@quimicosjc.org.br",
    "carteirinha":    "contato@quimicosjc.org.br",
    "atualizacao":    "contato@quimicosjc.org.br",
    "denuncia":       "contato@quimicosjc.org.br",
    "cadastro_noticias": "contato@quimicosjc.org.br"
  }'),
  ('denuncia_limites', '{
    "max_imagens":        5,
    "max_documentos":     5,
    "bytes_por_arquivo":  20971520,
    "bytes_total":        62914560,
    "tipos_imagem":       ["image/jpeg","image/png","image/webp"],
    "extensoes_doc":      ["pdf","docx"]
  }'),
  ('links_rodape', '{
    "csp":    "https://www.cspconlutas.org.br",
    "unidos": "https://www.instagram.com/unidospralutar/"
  }'),
  ('contatos', '{
    "sjc":     "(12) 3921-8177",
    "taubate": "(12) 3632-0932",
    "juridico":"quimisjc.jur@gmail.com"
  }');

-- ============================================================
-- USUÁRIOS DO PAINEL
-- Estende o sistema de autenticação do Supabase (auth.users)
-- ============================================================
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'ativo' CHECK (estado IN ('ativo','suspenso')),
  e_principal     BOOLEAN NOT NULL DEFAULT false, -- conta principal: proteção especial
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_atualizado
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- ============================================================
-- PERMISSÕES
-- Cada permissão é: usuário + área + ação + escopo
-- Denúncias têm concessão específica e independente
-- ============================================================
CREATE TABLE permissoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  area        TEXT NOT NULL, -- 'noticias','jornais','formularios','denuncia','config' etc.
  acao        TEXT NOT NULL, -- 'ler','criar','editar','publicar','excluir','exportar'
  delegado_por UUID REFERENCES usuarios(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, area, acao)
);

-- Regra: gestor não pode conceder permissão que não possui
CREATE OR REPLACE FUNCTION verificar_delegacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delegado_por IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM permissoes
      WHERE usuario_id = NEW.delegado_por
        AND area = NEW.area
        AND acao = NEW.acao
    ) THEN
      RAISE EXCEPTION 'Delegador não possui a permissão que está concedendo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER permissoes_delegacao
  BEFORE INSERT ON permissoes
  FOR EACH ROW EXECUTE FUNCTION verificar_delegacao();

-- ============================================================
-- CONTEÚDOS (notícias, páginas avulsas, páginas institucionais)
-- ============================================================
CREATE TABLE conteudos (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                    TEXT NOT NULL CHECK (tipo IN ('noticia','avulsa','institucional')),
  slug                    TEXT UNIQUE,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por              UUID REFERENCES usuarios(id),
  publicado_revisao_id    UUID, -- referência à revisão atualmente publicada
  trabalho_revisao_id     UUID, -- referência à revisão em edição
  excluido_em             TIMESTAMPTZ, -- NULL = ativo
  CONSTRAINT slug_valido CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- ============================================================
-- REVISÕES EDITORIAIS
-- Cada salvar cria uma nova revisão. Publicação não altera a versão de trabalho.
-- ============================================================
CREATE TABLE revisoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo_id   UUID NOT NULL REFERENCES conteudos(id) ON DELETE CASCADE,
  numero        INTEGER NOT NULL DEFAULT 1,
  titulo        TEXT,
  subtitulo     TEXT,
  chapeu        TEXT,
  corpo         TEXT, -- HTML sanitizado no servidor
  data_editorial TIMESTAMPTZ, -- data exibida publicamente (editável, inclusive para acervo)
  tags          TEXT[],
  slug_proposto TEXT,
  noindex       BOOLEAN NOT NULL DEFAULT false,
  metadados     JSONB DEFAULT '{}',
  autor_id      UUID REFERENCES usuarios(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conteudo_id, numero)
);

-- Chave estrangeira circular: aplicar depois de criar revisoes
ALTER TABLE conteudos
  ADD CONSTRAINT fk_publicado_revisao FOREIGN KEY (publicado_revisao_id) REFERENCES revisoes(id) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT fk_trabalho_revisao  FOREIGN KEY (trabalho_revisao_id)  REFERENCES revisoes(id) DEFERRABLE INITIALLY DEFERRED;

-- ============================================================
-- MÍDIA (fotos, PDFs, documentos)
-- ============================================================
CREATE TABLE midias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave_objeto    TEXT NOT NULL UNIQUE, -- nome interno no Supabase Storage
  nome_original   TEXT NOT NULL,        -- nome preservado como metadado
  bytes           BIGINT NOT NULL,
  mime_verificado TEXT NOT NULL,
  hash_sha256     TEXT NOT NULL,
  visibilidade    TEXT NOT NULL DEFAULT 'publica' CHECK (visibilidade IN ('publica','privada')),
  estado          TEXT NOT NULL DEFAULT 'pronta' CHECK (estado IN ('processando','pronta','erro')),
  derivados       JSONB DEFAULT '{}', -- ex: {"miniatura": "chave/mini.webp"}
  enviado_por     UUID REFERENCES usuarios(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relação mídia ↔ conteúdo (com ordenação, foco, legenda)
CREATE TABLE midias_conteudos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revisao_id    UUID NOT NULL REFERENCES revisoes(id) ON DELETE CASCADE,
  midia_id      UUID NOT NULL REFERENCES midias(id),
  ordem         INTEGER NOT NULL DEFAULT 0,
  foco_x        NUMERIC(4,3) DEFAULT 0.5, -- 0.0 a 1.0
  foco_y        NUMERIC(4,3) DEFAULT 0.5,
  legenda       TEXT,
  credito       TEXT,
  alt           TEXT,
  UNIQUE(revisao_id, midia_id)
);

-- ============================================================
-- JORNAIS
-- Publicação (ex: "Químico em Luta") → Edições (números)
-- ============================================================
CREATE TABLE publicacoes_jornal (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL,
  cor_hex   TEXT NOT NULL DEFAULT '#65172A',
  ativo     BOOLEAN NOT NULL DEFAULT true,
  ordem     INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE edicoes_jornal (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacao_id   UUID NOT NULL REFERENCES publicacoes_jornal(id),
  numero          INTEGER NOT NULL,
  complemento     TEXT DEFAULT '', -- ex: "Especial"
  data_edicao     DATE,
  titulo          TEXT,
  subtitulo       TEXT,
  complemento_txt TEXT,
  pdf_midia_id    UUID REFERENCES midias(id),
  capa_midia_id   UUID REFERENCES midias(id),
  estado          TEXT NOT NULL DEFAULT 'rascunho' CHECK (estado IN ('rascunho','publicado')),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Número único por publicação+complemento
  UNIQUE(publicacao_id, numero, complemento)
);

-- ============================================================
-- PROGRAMAÇÃO (publicação agendada)
-- ============================================================
CREATE TABLE programacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo_id     UUID NOT NULL REFERENCES conteudos(id) ON DELETE CASCADE,
  revisao_id      UUID NOT NULL REFERENCES revisoes(id),
  instante        TIMESTAMPTZ NOT NULL, -- quando publicar (fuso America/Sao_Paulo)
  estado          TEXT NOT NULL DEFAULT 'aguardando'
                  CHECK (estado IN ('aguardando','executado','cancelado','erro')),
  tentativas      INTEGER NOT NULL DEFAULT 0,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conteudo_id) -- somente uma programação ativa por conteúdo
);

-- ============================================================
-- FORMULÁRIOS e RECEBIMENTOS
-- ============================================================
CREATE TABLE formularios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        TEXT NOT NULL UNIQUE
              CHECK (tipo IN ('sindicalizacao','carteirinha','atualizacao','denuncia','cadastro_noticias')),
  titulo      TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  destinatario TEXT NOT NULL DEFAULT 'contato@quimicosjc.org.br',
  publicado_versao_id UUID,
  trabalho_versao_id  UUID,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE versoes_formulario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  campos      JSONB NOT NULL, -- array de campos com chave, tipo, rótulo, opções, obrigatório, ordem
  apresentacao TEXT,
  texto_autorizacao TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE formularios
  ADD CONSTRAINT fk_form_publicado FOREIGN KEY (publicado_versao_id) REFERENCES versoes_formulario(id) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT fk_form_trabalho  FOREIGN KEY (trabalho_versao_id)  REFERENCES versoes_formulario(id) DEFERRABLE INITIALLY DEFERRED;

-- Recebimentos (respostas dos formulários)
CREATE TABLE recebimentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo       TEXT NOT NULL UNIQUE DEFAULT 'PROT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  formulario_id   UUID NOT NULL REFERENCES formularios(id),
  versao_id       UUID NOT NULL REFERENCES versoes_formulario(id),
  enviado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valores         JSONB NOT NULL,          -- dados preenchidos
  snapshot_rotulos JSONB NOT NULL,         -- cópia dos rótulos usados no envio
  situacao        TEXT NOT NULL DEFAULT 'recebido'
                  CHECK (situacao IN ('recebido','em_atendimento','resolvido','arquivado')),
  nota_interna    TEXT,
  chave_idempotencia TEXT UNIQUE           -- evitar envios duplicados
);

-- Inscrições para notícias (cadastro de interesse — sem boletins)
CREATE TABLE inscricoes_noticias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  estado      TEXT NOT NULL DEFAULT 'ativo' CHECK (estado IN ('ativo','cancelado')),
  origem      TEXT DEFAULT 'site',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- LIXEIRA
-- ============================================================
CREATE TABLE lixeira (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade        TEXT NOT NULL, -- ex: 'conteudo', 'edicao_jornal'
  entidade_id     UUID NOT NULL,
  excluido_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  excluido_por    UUID REFERENCES usuarios(id),
  restauracao_limite TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '60 days',
  snapshot        JSONB NOT NULL -- cópia do registro no momento da exclusão
);

-- ============================================================
-- OUTBOX (fila de e-mails a enviar)
-- ============================================================
CREATE TABLE outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento          TEXT NOT NULL, -- ex: 'recebimento_formulario', 'denuncia'
  recebimento_id  UUID REFERENCES recebimentos(id),
  destinatario    TEXT NOT NULL,
  tentativas      INTEGER NOT NULL DEFAULT 0,
  estado          TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (estado IN ('pendente','enviado','erro_permanente')),
  ultimo_erro     TEXT,
  proximo_envio   TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRILHA DE AUDITORIA
-- Não registrar conteúdo integral de denúncias ou segredos
-- ============================================================
CREATE TABLE auditoria (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ator_id   UUID REFERENCES usuarios(id),
  acao      TEXT NOT NULL,      -- ex: 'publicar', 'excluir', 'exportar'
  alvo      TEXT NOT NULL,      -- ex: 'conteudo:uuid'
  instante  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resultado TEXT NOT NULL CHECK (resultado IN ('sucesso','falha')),
  correlacao TEXT               -- ID de requisição para rastrear sequências
);

-- ============================================================
-- ÍNDICES para performance nas consultas mais comuns
-- ============================================================
CREATE INDEX ON conteudos (tipo, excluido_em);
CREATE INDEX ON conteudos (slug) WHERE excluido_em IS NULL;
CREATE INDEX ON revisoes (conteudo_id, criado_em DESC);
CREATE INDEX ON edicoes_jornal (publicacao_id, numero DESC);
CREATE INDEX ON recebimentos (formulario_id, enviado_em DESC);
CREATE INDEX ON recebimentos (protocolo);
CREATE INDEX ON outbox (estado, proximo_envio) WHERE estado = 'pendente';
CREATE INDEX ON programacoes (instante) WHERE estado = 'aguardando';
CREATE INDEX ON auditoria (alvo, instante DESC);

-- ============================================================
-- DADOS INICIAIS: formulários com tipos corretos
-- Destinatário inicial: contato@quimicosjc.org.br (alterável pelo painel)
-- ============================================================
INSERT INTO formularios (tipo, titulo, destinatario) VALUES
  ('sindicalizacao',    'Filiação ao Sindicato',       'contato@quimicosjc.org.br'),
  ('carteirinha',       'Solicitação de Carteirinha',   'contato@quimicosjc.org.br'),
  ('atualizacao',       'Atualização Cadastral',        'contato@quimicosjc.org.br'),
  ('denuncia',          'Denúncia',                     'contato@quimicosjc.org.br'),
  ('cadastro_noticias', 'Cadastro para Notícias',       'contato@quimicosjc.org.br');
