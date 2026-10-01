# Diário do Projeto — Site Sindicato dos Químicos SJC

> Registro de tudo que foi feito, quando e por quê.
> Atualizado a cada etapa concluída.

---

## Decisões técnicas registradas

| Data | Decisão | Motivo |
|------|---------|--------|
| 29/09/2026 | Stack: Next.js + Supabase + Vercel + Resend | Gratuito para começar, profissional, sem gerenciar servidor |
| 29/09/2026 | Hospedagem: Vercel (site) + Supabase (banco/arquivos) | Substitui o Hotel da Web com mais qualidade e custo zero inicial |
| 29/09/2026 | "Toque automático" configurado para o Supabase | Evita que o banco "hiberne" após 7 dias sem visitas; implementar via Vercel Cron a cada 5 dias |
| 29/09/2026 | Controle de versões: pastas v1/, v2/ etc. | Segurança: nunca sobrescrever sem criar ponto de recuperação |
| 29/09/2026 | Sem IA, sem captura automática de redes sociais | Decisão expressa do Sindicato; publicação e links são sempre manuais |
| 29/09/2026 | Painel intuitivo igual ao protótipo v9 | Operado por pessoa do Sindicato sem conhecimento técnico |
| 30/09/2026 | Migração: fotos verticais e proporções originais | Se houver foto em pé (vertical) no acervo atual, preservar orientação original sem corte horizontal forçado. Nunca esticar fotos pequenas. |


---

## Pendências documentadas (o que depende de ação externa)

| Item | O que falta | Quem resolve |
|------|-------------|--------------|
| Node.js no computador | Instalar via nodejs.org | Rodrigo (ver instrucoes-para-voce.md) |
| Conta GitHub | Criar em github.com | Rodrigo |
| Conta Vercel | Criar em vercel.com | Rodrigo |
| Conta Supabase | Criar em supabase.com | Rodrigo |
| Conta Resend | Criar em resend.com | Rodrigo |
| Domínio quimicosjc.org.br | Verificar se está no Hotel da Web ou Registro.br | Rodrigo — perguntar ao Hotel da Web |
| Acervo do site atual | Exportar conteúdo pelo painel CMS atual | Rodrigo — quando o novo site estiver pronto |
| CCT 2019 em diante | Solicitar ao Jurídico: (12) 3921-8177 ou quimisjc.jur@gmail.com | Sindicato |
| Limites gerais de upload editorial | Medir após acesso ao acervo real | Após exportação |

---

## Histórico de etapas

### 29/09/2026 — Dia 1 ✅ CONCLUÍDO

- [x] Leitura completa de todos os arquivos do pacote GPT
- [x] Análise crítica do material (ver conversa inicial)
- [x] Protótipo de referência extraído em `prototipo-referencia/`
- [x] Pasta `v1/` criada com Git inicializado
- [x] Diário do projeto criado
- [x] Documentação de pendências criada
- [x] Node.js v24.21.0 (LTS) instalado e funcionando
- [x] Projeto Next.js 16.3.7 estruturado
- [x] Schema completo do banco de dados (15 tabelas)
- [x] Configurações de segurança (headers, cache, gitignore, .env.example)
- [x] Paleta oficial do Sindicato aplicada no CSS
- [x] Vercel Cron: 4 jobs automáticos (keepalive, publicação, lixeira, backup)
- [x] "Toque automático" do Supabase implementado e documentado
- [x] Build limpo: compilação OK, TypeScript OK, 0 vulnerabilidades
- [x] Tag `v1.0-base` criada no Git
- [x] Contas criadas: GitHub (quimicosjc), Vercel (quimicosjc) e Supabase (quimicos-sjc)
- [x] Repositório sincronizado via GitHub Desktop (quimicosjc/v1)
- [x] Deploy em produção no Vercel: https://v1-three-hazel.vercel.app
- [x] Banco de dados Supabase estruturado com 15 tabelas (São Paulo - sa-east-1)
- [x] Integração Vercel + Supabase validada e ativa ("toque automático" respondendo com sucesso)
- [x] Serviço de e-mails Resend configurado e integrado (local e Vercel)
- [x] Sistema de autenticação completo: login, proteção de rotas, logout
- [x] Painel acessado com sucesso via login real (Supabase Auth)
- [x] Visual do painel fiel ao protótipo v9 aprovado pelo Sindicato

---

## Anotação técnica: o "toque automático" do Supabase

O Supabase no plano gratuito coloca o banco de dados em modo de espera
após 7 dias sem nenhuma visita ao site. A primeira visita depois desse
período pode demorar 3-4 segundos para "acordar".

**Solução implementada:** um pequeno programa (chamado de "Cron Job")
vai "tocar" o banco a cada 5 dias automaticamente — mesmo sem nenhuma
visita. Funciona 24h por dia, sem intervenção manual.

Arquivo responsável: `app/api/keepalive/route.ts` (a criar no Dia 1)
Configuração: `vercel.json` → crons → a cada 5 dias às 06:00 BRT
