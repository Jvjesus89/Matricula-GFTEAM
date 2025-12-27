import { useEffect } from 'react'
import '../styles/ComprovantePagamento.css'

function ComprovantePagamento({ financeiro, onClose }) {
  useEffect(() => {
    // Quando o componente montar, prepara para impressão
    const handleBeforePrint = () => {
      // Remove o botão de fechar antes de imprimir
      const closeBtn = document.querySelector('.comprovante-close-btn')
      if (closeBtn) closeBtn.style.display = 'none'
    }

    const handleAfterPrint = () => {
      // Restaura o botão após imprimir
      const closeBtn = document.querySelector('.comprovante-close-btn')
      if (closeBtn) closeBtn.style.display = 'block'
    }

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const formatarData = (data) => {
    if (!data) return '-'
    const date = new Date(data)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatarDataHora = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`
  }

  const formatarValor = (valor) => {
    return `R$ ${parseFloat(valor || 0).toFixed(2)}`
  }

  const handlePrint = () => {
    window.print()
  }

  if (!financeiro) return null

  return (
    <div className="comprovante-overlay" onClick={onClose}>
      <div className="comprovante-container" onClick={(e) => e.stopPropagation()}>
        <button className="comprovante-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="comprovante-content">
          {/* Logos */}
          <div className="comprovante-header">
            <img src="/picture/gfteam.png" alt="GF TEAM" className="comprovante-logo-gfteam" />
            <img src="/picture/logosaquafit.jpg" alt="SAQUAFIT" className="comprovante-logo-saquafit" />
          </div>

          {/* Título */}
          <h1 className="comprovante-title">Comprovante de Pagamento</h1>

          {/* Dados do pagamento */}
          <div className="comprovante-dados">
            <div className="comprovante-item">
              <span className="comprovante-label">Aluno:</span>
              <span className="comprovante-value">{financeiro.nome || financeiro.usuario || '-'}</span>
            </div>

            <div className="comprovante-item">
              <span className="comprovante-label">Valor:</span>
              <span className="comprovante-value">{formatarValor(financeiro.valor)}</span>
            </div>

            <div className="comprovante-item">
              <span className="comprovante-label">Data de Vencimento:</span>
              <span className="comprovante-value">{formatarData(financeiro.data_vencimento)}</span>
            </div>

            <div className="comprovante-item">
              <span className="comprovante-label">Data de Pagamento:</span>
              <span className="comprovante-value">{formatarData(financeiro.data_pagamento)}</span>
            </div>
          </div>

          {/* Rodapé */}
          <div className="comprovante-footer">
            <p>GFTEAM - Comprovante emitido em {formatarDataHora()}</p>
          </div>

          {/* Botão Imprimir */}
          <div className="comprovante-actions">
            <button className="comprovante-btn-print" onClick={handlePrint}>
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComprovantePagamento


