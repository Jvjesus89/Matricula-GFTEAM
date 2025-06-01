// Função para gerar e imprimir o comprovante
function imprimirComprovante(idfinanceiro) {
  fetch(`/.netlify/functions/obterFinanceiro?idfinanceiro=${idfinanceiro}`)
    .then(response => response.json())
    .then(data => {
      const registro = data.find(f => f.idfinanceiro === idfinanceiro);
      if (registro) {
        // Cria uma nova janela para o comprovante
        const win = window.open('', '_blank');
        win.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Comprovante de Pagamento - GFTEAM</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 40px;
                line-height: 1.6;
              }
              .comprovante {
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logos {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 30px;
                margin-bottom: 20px;
              }
              .logos img {
                height: 100px;
                object-fit: contain;
              }
              .info {
                margin: 20px 0;
              }
              .info-item {
                margin: 10px 0;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 0.9em;
                color: #666;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 20px;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="comprovante">
              <div class="header">
                <div class="logos">
                  <img src="picture/gfteam.png" alt="GFTEAM Logo">
                  <img src="picture/logosaquafit.jpg" alt="Aquafit Logo">
                </div>
                <h2>Comprovante de Pagamento</h2>
              </div>
              
              <div class="info">
                <div class="info-item"><strong>Aluno:</strong> ${registro.nome}</div>
                <div class="info-item"><strong>Valor:</strong> R$ ${parseFloat(registro.valor).toFixed(2)}</div>
                <div class="info-item"><strong>Data de Vencimento:</strong> ${new Date(registro.data_vencimento).toLocaleDateString('pt-BR')}</div>
                <div class="info-item"><strong>Data de Pagamento:</strong> ${new Date(registro.data_pagamento).toLocaleDateString('pt-BR')}</div>
              </div>

              <div class="footer">
                <p>GFTEAM - Comprovante emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
              </div>

              <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()">Imprimir</button>
              </div>
            </div>
          </body>
          </html>
        `);
        win.document.close();
      }
    })
    .catch(error => {
      console.error('Erro ao carregar dados do registro:', error);
      alert('Erro ao gerar comprovante');
    });
} 