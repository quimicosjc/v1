import React from 'react'

/**
 * Tokens do Sistema Visual do Sindicato dos Químicos de SJC e Região
 * Inspirado no estilo de impacto sindical (Opção D) com rigor tipográfico e paleta aprovada.
 */

export const CORES = {
  // Paleta Bordô Oficial
  primary: '#65172A',       // Bordô escuro institucional (Header, Sidebar, Blocos de Destaque)
  action: '#861E32',        // Bordô ativo / ação (Botões primários, links ativos, badges)
  actionHover: '#9E243C',   // Hover do bordô ativo
  secondary: '#791C30',     // Bordô intermediário
  topbar: '#521322',        // Faixa superior ultra-escura

  // Neutros e Superfície
  ink: '#30252A',           // Cor primária de texto
  inkLight: '#4F4248',      // Texto intermediário
  muted: '#71636A',         // Texto secundário e legendas
  line: '#E4DCE0',          // Bordas sutis e divisórias
  lineLight: '#EFE9EC',     // Divisórias mais suaves
  bg: '#F7F5F6',            // Fundo neutro geral da aplicação
  surface: '#FFFFFF',       // Fundo de cards e seções
}

export const TIPOGRAFIA = {
  fontTitle: 'var(--font-condensed), sans-serif',
  fontBody: 'var(--font-barlow), sans-serif',
}

export const CONTAINER_STYLE: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 20px',
  boxSizing: 'border-box',
  width: '100%',
}
