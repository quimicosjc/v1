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

### 29/09/2026 — Dia 1 (preparação)

- [x] Leitura completa de todos os arquivos do pacote GPT
- [x] Análise crítica do material (ver conversa inicial)
- [x] Protótipo de referência extraído em `prototipo-referencia/`
- [x] Pasta `v1/` criada com Git inicializado
- [x] Diário do projeto criado
- [x] Documentação de pendências criada
- [ ] Node.js instalado (aguardando Rodrigo)
- [ ] Contas nos serviços criadas (aguardando Rodrigo)
- [ ] Projeto Next.js iniciado (aguarda Node.js)

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
