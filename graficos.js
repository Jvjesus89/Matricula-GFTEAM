// Função para inicializar os gráficos
function inicializarGraficos() {
    // Gráfico de pagamentos mensais
    fetch('/.netlify/functions/obterFinanceiro')
        .then(response => response.json())
        .then(data => {
            // chama todos os gráficos: mensal, status, novos alunos (com base em dtcadastro) e valor
            criarGraficoMensal(data);
            criarGraficoStatus(data);
            criarGraficoAlunos(data);
            criarGraficoValor(data);
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
function criarGraficoAlunos(data) {
    const alunosPorMes = {};
    // Usaremos um Set para garantir que cada aluno seja contado apenas uma vez
    const alunosJaContados = new Set(); 

    // Ordena os dados pela data de cadastro para processar na ordem certa
    data.sort((a, b) => new Date(a.dtcadastro) - new Date(b.dtcadastro));

    data.forEach(item => {
        // CORREÇÃO: Verifica se o aluno já foi contado. Se não, conta e adiciona ao Set.
        if (item.dtcadastro && item.idusuario && !alunosJaContados.has(item.idusuario)) {
            
            alunosJaContados.add(item.idusuario); // Marca o aluno como contado

            const mes = new Date(item.dtcadastro).toLocaleString('pt-BR', { year: 'numeric', month: 'long' });
            alunosPorMes[mes] = (alunosPorMes[mes] || 0) + 1;
        }
    });

    const meses = Object.keys(alunosPorMes).sort((a, b) => new Date(a) - new Date(b));
    const valores = meses.map(mes => alunosPorMes[mes]);

    const trace = {
        x: meses,
        y: valores,
        type: 'bar',
        marker: { color: '#17a2b8' }
    };
    const layout = {
        title: 'Novos Alunos por Mês',
        xaxis: { title: 'Mês de Cadastro' },
        yaxis: { title: 'Quantidade de Alunos', tickformat: 'd' } // Garante que o eixo Y mostre números inteiros
    };
    Plotly.newPlot('grafico-alunos', [trace], layout);
}


function criarGraficoValor(data) {
    // Objeto para agrupar os valores a receber por mês de vencimento
    const valorAReceberPorMes = {};

    data.forEach(item => {
        // A condição principal agora é ter uma data de vencimento válida
        if (item.data_vencimento) {
            const dataVenc = new Date(item.data_vencimento);
            
            // Criamos uma chave numérica única (timestamp) para o primeiro dia de cada mês.
            // Isso garante que cada mês/ano seja um grupo distinto e fácil de ordenar.
            const mesChave = new Date(dataVenc.getFullYear(), dataVenc.getMonth(), 1).getTime();
            
            // Soma o valor do lançamento financeiro, pago ou não
            valorAReceberPorMes[mesChave] = (valorAReceberPorMes[mesChave] || 0) + (Number(item.valor) || 0);
        }
    });

    // 1. Criamos uma lista de objetos a partir dos dados agrupados
    const dadosAgrupados = Object.keys(valorAReceberPorMes).map(chaveTimestamp => {
        return {
            timestamp: parseInt(chaveTimestamp), // A data como um número
            valor: valorAReceberPorMes[chaveTimestamp] // O valor somado para aquele mês
        };
    });

    // 2. A MÁGICA: Ordenamos a lista numericamente pelo timestamp.
    // Isso garante a ordem cronológica correta (Janeiro, Fevereiro, Março...).
    dadosAgrupados.sort((a, b) => a.timestamp - b.timestamp);

    // 3. Agora, com os dados já ordenados, criamos as listas para o gráfico
    const mesesLabels = dadosAgrupados.map(item => {
        const data = new Date(item.timestamp);
        // Transforma o timestamp ordenado em um nome de mês legível
        return data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    });

    const valores = dadosAgrupados.map(item => item.valor);

    const trace = {
        x: mesesLabels,
        y: valores,
        type: 'bar',
        marker: { color: '#ffc107' }
    };

    const layout = {
        title: 'Valor Total a Receber por Mês',
        yaxis: { title: 'Valor a Receber (R$)' }
    };

    Plotly.newPlot('grafico-valor', [trace], layout);
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