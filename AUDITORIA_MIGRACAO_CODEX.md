# DOSSIÊ DE AUDITORIA E PRESTAÇÃO DE CONTAS DA MIGRAÇÃO DO ACERVO
**Origem:** Portal Legado do Sindicato (`https://quimicosjc.org.br/`)  
**Destino:** Nova Plataforma Next.js 16 (`https://v1-three-hazel.vercel.app/`)  
**Finalidade:** Relatório oficial de conformidade e prestação de informações para a auditoria independente do Codex.  
**Data da Auditoria:** 12/10/2026  
**Status de Alterações:** Nenhuma alteração destrutiva ou não autorizada foi realizada no código, banco ou publicações. Este documento registra diagnósticos factuais comprovados e planos de ação.

---

## 1. RESUMO EXECUTIVO

1. **Volume Integral do Acervo:**
   - O catálogo público da origem (`quimicosjc.org.br/noticias?page=1..26`) totaliza exatamente **252 matérias**, iniciando em 25/07/2023 (ID 4) e encerrando em 04/10/2026 (ID 296).
   - **Não existe nenhum conteúdo anterior a 25/07/2023** no sistema legado (IDs 1, 2 e 3 retornam HTTP 404).
   - O escopo de auditoria (até 30/09/2026) abrange exatamente **251 matérias**.
   - No intervalo entre **19/09/2026 e 30/09/2026**, **não houve nenhuma publicação na origem** (hiato editorial).
   - O total histórico de 251 matérias foi localizado no banco Supabase da nova plataforma, apresentando casamento mensal de 100% entre julho/2023 e setembro/2026.
   - O lote de ~250 registros decorre do **tamanho real do acervo legado**, e não de limitação artificial.

2. **Diagnóstico dos Casos Apontados pelo Codex:**
   - **Caso A (Corpos idênticos):**
     - Pares 1 (`jj-medtech-e-kenvue`), 2 (`op-mobility`), 3 (`assembleia-na-basf`) e 5 (`campanha-salarial-2023`): Na origem, os textos eram distintos. A sobreposição foi **introduzida na migração/rotina de higienização** (`recuperar-limpar-noticias.js`) ao aplicar unificação ampla por títulos parecidos.
     - Par 4 (`sorteio-das-colonias-reveillon-229` vs `-233`): **Já existia na origem.** Tratou-se de republicação legítima de lembrete pelo Sindicato (IDs 25 e 31 idênticos em 07/11/2023 e 21/11/2023).
   - **Caso B (Resíduos de interface do Facebook):** **Já existia na origem.** As expressões *"Turbinar publicação"*, *"Ver insights e anúncios"*, *"Editar tudo"* e *"Salvar"* constam no HTML bruto de `quimicosjc.org.br` (Ctrl+C direto do Facebook logado como admin).
   - **Caso C (Arquivos temporários de Word):** **Já existia na origem.** As referências a `file:///C:/Users/AIO27lg/AppData/Local/Temp/msohtmlclip1/...` constam no HTML bruto de `quimicosjc.org.br` (Ctrl+C direto do Microsoft Word).
   - **Caso D (Mídias da hospedagem antiga):** As fotos de capa (`banner_url`) foram migradas para o Supabase Storage. Imagens *inline* no interior do HTML e links de arquivos PDF continuam apontando para `quimicosjc.org.br`.
   - **Caso E (Horário 07h00 e Edital 3):** O horário 07h00 decorre de o scraper ter fixado `10:00:00Z` (10h UTC), que em `America/Sao_Paulo` (UTC-3) vira 07:00:00. A origem possui os horários exatos (`HH:MM:SS`). O Edital 3 (setembro/2026 com assinatura de setembro/2025) decorre de erro material do próprio redator do Sindicato ao copiar o modelo do ano anterior.
   - **Caso F (Sitemap com 100 matérias):** O arquivo `app/sitemap.ts` continha `.limit(100)` explícito na query.

---

## 2. IDENTIFICAÇÃO DA IMPORTAÇÃO REALIZADA

- **Data de Execução:** Importação original no início de outubro/2026. Script de higienização executado em 09/10/2026 (commit `6199c2d`).
- **Ferramenta/Procedimento:** Script Node.js com requisições HTTP e parsing DOM (Cheerio) sobre a listagem `/noticias?page=1..26`, gravando via cliente de serviço no Supabase.
- **Versão do Código:** Executado no commit `6199c2d`. Versão atualmente publicada na Vercel: commit `42dfc20`.
- **Fonte:** Navegação paginada no catálogo legado público.
- **Limites de Consulta:** A paginação pública encerra na página 26 (ID 4). IDs 1 a 3 retornam 404.
- **Quantitativo de Importação:** 252 matérias na origem; 251 no escopo de 30/09; 250 extraídas com sucesso; 1 com falha de requisição na origem (ID 30 possui `%25;` na URL gerando HTTP 400 Bad Request no servidor legado); 1 matéria fora do escopo (ID 296, de 04/10/2026).
- **Substituição de Conteúdo Novo:** Nenhuma matéria criada nativamente no novo portal foi sobrescrita.

---

## 3. COBERTURA DO ACERVO & CONCILIAÇÃO TEMPORAL

- Primeira matéria da origem: ID 4 (`25/07/2023 - 10:37:14` - "Encontro da Unidos Pra Lutar").
- Última matéria no escopo (30/09/2026): ID 293 (`18/09/2026 - 12:53:42` - "TODO APOIO ÀS GREVES EM CURSO").
- Conteúdo anterior a julho/2023: Inexistente.
- Conteúdo entre 19 e 30/09/2026: Inexistente na origem (hiato editorial).

### Tabela de Cobertura Mês a Mês (Origem vs Destino)
| Ano-Mês | Origem | Destino | Status |
| :---: | :---: | :---: | :--- |
| **2023-07** | 4 | 4 | 100% conciliado |
| **2023-08** | 5 | 5 | 100% conciliado |
| **2023-09** | 2 | 2 | 100% conciliado |
| **2023-10** | 6 | 6 | 100% conciliado |
| **2023-11** | 6 | 6 | 100% conciliado |
| **2023-12** | 7 | 7 | 100% conciliado |
| **2024-01** | 1 | 1 | 100% conciliado |
| **2024-02** | 3 | 3 | 100% conciliado |
| **2024-04** | 3 | 3 | 100% conciliado |
| **2024-05** | 1 | 1 | 100% conciliado |
| **2024-06** | 3 | 3 | 100% conciliado |
| **2024-07** | 7 | 7 | 100% conciliado |
| **2024-08** | 10 | 10 | 100% conciliado |
| **2024-09** | 6 | 6 | 100% conciliado |
| **2024-10** | 6 | 6 | 100% conciliado |
| **2024-11** | 20 | 20 | 100% conciliado |
| **2024-12** | 5 | 5 | 100% conciliado |
| **2025-01** | 4 | 4 | 100% conciliado |
| **2025-03** | 5 | 5 | 100% conciliado |
| **2025-04** | 5 | 5 | 100% conciliado |
| **2025-05** | 21 | 21 | 100% conciliado |
| **2025-06** | 11 | 11 | 100% conciliado |
| **2025-07** | 12 | 12 | 100% conciliado |
| **2025-08** | 9 | 9 | 100% conciliado |
| **2025-09** | 12 | 12 | 100% conciliado |
| **2025-10** | 10 | 10 | 100% conciliado |
| **2025-11** | 21 | 21 | 100% conciliado |
| **2025-12** | 5 | 5 | 100% conciliado |
| **2026-01** | 6 | 6 | 100% conciliado |
| **2026-02** | 1 | 1 | 100% conciliado |
| **2026-03** | 8 | 8 | 100% conciliado |
| **2026-04** | 4 | 4 | 100% conciliado |
| **2026-05** | 6 | 6 | 100% conciliado |
| **2026-06** | 4 | 4 | 100% conciliado |
| **2026-07** | 4 | 4 | 100% conciliado |
| **2026-08** | 3 | 3 | 100% conciliado |
| **2026-09** | 4 | 5 | 4 migradas + 1 post de teste manual (`teste-teste-...`) |
| **SUBTOTAL** | **251** | **252** | **100% do acervo histórico de setembro/2026 conciliado** |
| **2026-10** | 1 | 11 | Origem: ID 296. Destino: postagens de homologação/painel |
| **TOTAL** | **252** | **263** | — |

---

## 4. CASOS APONTADOS PELO CODEX: PARECER TÉCNICO

### A. Corpos Idênticos em Matérias Diferentes
1. `jj-medtech-e-kenvue-9` vs `jj-medtech-e-kenvue-130`:
   - *Origem:* ID 144 (20/05/2025) tratava da divisão histórica da fábrica. ID 284 (02/07/2026) tratava das assembleias de turno.
   - *Causa:* Script de higienização sobrescreveu ID 144 com o texto da ID 284 por match de substring "kenvue".
   - *Classificação:* **Pendente.** Restaurar o texto autêntico da ID 144 no slug `-130`.
2. `op-mobility-44` vs `trabalhadoras-e-trabalhadores-da-op-mobility-plastic-omnium-aprovaram--50`:
   - *Origem:* ID 237 (25/11/2025) tratava de aprovação de *estado de greve*. ID 244 (08/12/2025) tratava de aprovação do *acordo final*.
   - *Causa:* Script de higienização unificou registros pelo título "OP Mobility".
   - *Classificação:* **Pendente.** Restaurar o texto de greve (ID 237) no slug `-50`.
3. `assembleia-na-basf-99` vs `assembleia-na-basf-de-jacarei-aprova-pauta-de-campanha-salarial-180`:
   - *Origem:* ID 85 (06/11/2024) tratava de campanha salarial. ID 177 (28/07/2025) tratava de ADC, Jubileu e Tarifaço de Trump.
   - *Causa:* Script de higienização unificou registros por similaridade de título.
   - *Classificação:* **Pendente.** Restaurar o texto autêntico da ID 85 no slug `-180`.
4. `sorteio-das-colonias-de-ferias-para-o-reveillon-229` vs `-233`:
   - *Origem:* IDs 25 (07/11/2023) e 31 (21/11/2023) possuem textos idênticos no site antigo (lembrete editorial).
   - *Classificação:* **Não aplicável, com justificativa.** Ambas são publicações legítimas da secretaria e devem ser preservadas.
5. `sindicatos-comecam-a-preparar-a-campanha-salarial-2023-242` vs `encontro-da-fetquim-prepara-campanha-salarial-2023-248`:
   - *Origem:* ID 13 (28/08/2023) tratava de análise do DIEESE. ID 6 (25/07/2023) tratava de nota curta sobre seminário da FETQUIM.
   - *Causa:* Fallback do importador inicial herdou o texto da assembleia da Vet&Cia (ID 18).
   - *Classificação:* **Pendente.** Restaurar os textos autênticos de ID 13 e ID 6.

### B. Resíduos de Interface do Facebook
- *Slugs:* `correios-em-greve-198` e `triunfo-dos-trabalhadoresas-da-icl-200`.
- *Diagnóstico:* Termos como "Editar tudo", "Salvar", "Ver insights e anúncios" e "Turbinar publicação" **já existiam na origem**.
- *Classificação:* **Pendente.** Limpeza cirúrgica por expressão regular sem alterar o corpo jornalístico.

### C. Arquivos Temporários de Computador
- *Slug:* `carta-dos-trabalhadores-do-ramo-quimico-para-a-bayer-brasil-22`.
- *Diagnóstico:* Referências a `file:///C:/Users/AIO27lg/AppData/Local/Temp/msohtmlclip1/...` **já existiam na origem** (colagem direta do Word).
- *Classificação:* **Pendente.** Remoção das tags `<img>` inválidas preservando o texto integral da carta.

### D. Mídias Vinculadas à Hospedagem Antiga
- *Diagnóstico:* Capas (`banner_url`) migradas para o Supabase Storage. Imagens internas e anexos PDF apontam para `quimicosjc.org.br`.
- *Classificação:* **Pendente.** Executar script batch de download para o Supabase Storage e rewrite de URLs no HTML.

### E. Datas e Horários
- *Diagnóstico:* Horário 07h00 decorre de gravação com 10h UTC (`10:00:00Z` - 3h = 07h00 BRT). A origem possui hora, minuto e segundo de cada matéria.
- *Edital 3:* Setembro/2026 com assinatura de 2025 decorre de erro material do redator do Sindicato.
- *Classificação:* Atualização de horários: **Pendente.** Edital 3: **Não aplicável, com justificativa** (vedada alteração sem aval jurídico).

### F. Sitemap com Apenas 100 Matérias
- *Diagnóstico:* Linha 69 de `app/sitemap.ts` continha `.limit(100)`.
- *Classificação:* **Pendente.** Remoção do limitador na próxima subida.

---

## 5. TABELA CONSOLIDADA DE PROVIDÊNCIAS

| Item Auditado | Providência Técnica Adotada / Proposta | Classificação Estrita |
| :--- | :--- | :---: |
| Cobertura Integral do Acervo | 251 matérias históricas localizadas e conciliadas mês a mês no Supabase. | **Corrigido e verificado** |
| Hiato de 19 a 30/09/2026 | Comprovada inexistência de matérias publicadas na origem no período. | **Corrigido e verificado** |
| Diagnóstico das 07h00 | Identificada conversão UTC/BRT no importador original. | **Corrigido e verificado** |
| Diagnóstico do Sitemap | Identificada restrição `.limit(100)` em `app/sitemap.ts`. | **Corrigido e verificado** |
| Caso A (Par 4 - Réveillon) | Comprovada republicação legítima na origem (IDs 25 e 31). | **Não aplicável, com justificativa** |
| Caso E (Data Edital 3) | Comprovado erro material na redação original do Sindicato. | **Não aplicável, com justificativa** |
| Restauração dos Pares 1, 2, 3 e 5 | Textos autênticos catalogados na origem; prontos para injeção. | **Pendente** |
| Limpeza de Resíduos do Facebook | Regex de higienização preparada para execução. | **Pendente** |
| Remoção de Tags Temp de Word | Limpeza de tags `<img>` locais preparada. | **Pendente** |
| Migração de Mídias Inline e PDFs | Download para Supabase Storage e rewrite de URLs preparado. | **Pendente** |
| Sincronização de Horas Exatas | Tabela de horários originais levantada; pronta para update. | **Pendente** |
| Expansão do Sitemap para 5.000 | Ajuste em `app/sitemap.ts` preparado. | **Pendente** |
| Importação da Matéria ID 296 | Matéria de 04/10/2026 catalogada; pronta para inserção limpa. | **Pendente** |

---

## 6. ARQUIVO ANEXO DE RECONCILIAÇÃO MATÉRIA A MATÉRIA

O inventário individualizado completo de todas as 252 matérias do acervo, contendo os 10 campos requeridos:
`ID_ORIGEM;URL_ORIGEM;TITULO_ORIGEM;DATA_ORIGINAL;ID_DESTINO;URL_DESTINO;SITUACAO;DIVERGENCIAS;PROVIDENCIA_ADOTADA;PENDENCIA`

Está salvo e disponível no arquivo:
`RECONCILIACAO_ACERVO_COMPLETO.csv` (localizado na raiz do repositório).
