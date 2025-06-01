// Função para inicializar os gráficos
function inicializarGraficos() {
    // Gráfico de pagamentos mensais
    fetch('/.netlify/functions/obterFinanceiro')
        .then(response => response.json())
        .then(data => {
            criarGraficoMensal(data);
            criarGraficoStatus(data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados para os gráficos:', error);
        });
}

// Gráfico de pagamentos mensais
function criarGraficoMensal(data) {
    // Agrupa os valores por mês
    const pagamentosPorMes = {};
    data.forEach(item => {
        if (item.data_pagamento) {
            const mes = new Date(item.data_pagamento).toLocaleString('pt-BR', { month: 'long' });
            pagamentosPorMes[mes] = (pagamentosPorMes[mes] || 0) + item.valor;
        }
    });

    const meses = Object.keys(pagamentosPorMes);
    const valores = Object.values(pagamentosPorMes);

    const trace = {
        x: meses,
        y: valores,
        type: 'bar',
        marker: {
            color: '#007bff'
        }
    };

    const layout = {
        title: 'Pagamentos por Mês',
        xaxis: {
            title: 'Mês'
        },
        yaxis: {
            title: 'Valor Total (R$)'
        }
    };

    Plotly.newPlot('grafico-mensal', [trace], layout);
}

// Gráfico de status dos pagamentos
function criarGraficoStatus(data) {
    const hoje = new Date();
    let pagos = 0;
    let pendentes = 0;
    let atrasados = 0;

    data.forEach(item => {
        const dataVencimento = new Date(item.data_vencimento);
        if (item.data_pagamento) {
            pagos++;
        } else if (dataVencimento < hoje) {
            atrasados++;
        } else {
            pendentes++;
        }
    });

    const trace = {
        values: [pagos, pendentes, atrasados],
        labels: ['Pagos', 'Pendentes', 'Atrasados'],
        type: 'pie',
        marker: {
            colors: ['#28a745', '#ffc107', '#dc3545']
        }
    };

    const layout = {
        title: 'Status dos Pagamentos'
    };

    Plotly.newPlot('grafico-status', [trace], layout);
}

// Atualiza os gráficos quando mudar de aba
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa os gráficos quando a aba de gráficos for selecionada
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        if (e.target.getAttribute('href') === '#graficos') {
            inicializarGraficos();
        }
    });
}); 