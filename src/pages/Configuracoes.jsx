import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Alunos.css'

function Configuracoes() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('configuracao')
  const [configuracoes, setConfiguracoes] = useState({
    horario_funcionamento: '',
    valor_ate_vencimento: '',
    valor_apos_vencimento: '',
  })
  const [loadingConfig, setLoadingConfig] = useState(false)
  
  // Estados para testes
  const [testeAlunos, setTesteAlunos] = useState([])
  const [testeFinanceiros, setTesteFinanceiros] = useState([])
  const [testeSelecionado, setTesteSelecionado] = useState({
    aluno: '',
    financeiro: '',
    valor: '',
  })
  const [loadingTeste, setLoadingTeste] = useState(false)

  useEffect(() => {
    loadConfiguracoes()
    if (activeTab === 'teste' && isAdmin()) {
      loadDadosTeste()
    }
  }, [activeTab, isAdmin])

  const loadConfiguracoes = async () => {
    try {
      setLoadingConfig(true)
      const data = await api.obterConfiguracoes()
      setConfiguracoes({
        horario_funcionamento: data.horario_funcionamento || '',
        valor_ate_vencimento: data.valor_ate_vencimento || '',
        valor_apos_vencimento: data.valor_apos_vencimento || '',
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      alert('Erro ao carregar configurações')
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleSubmitConfiguracao = async (e) => {
    e.preventDefault()

    try {
      setLoadingConfig(true)
      await api.salvarConfiguracoes(configuracoes)
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert(error.message || 'Erro ao salvar configurações')
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleProcessarLancamentos = async () => {
    if (!window.confirm('Deseja processar os lançamentos mensais agora? Isso criará/atualizará os lançamentos para todos os alunos.')) {
      return
    }

    try {
      setLoadingConfig(true)
      const resultado = await api.processarLancamentosMensais()
      alert(`Processamento concluído!\n\nCriados: ${resultado.total_criados || 0}\nAtualizados: ${resultado.total_atualizados || 0}\nErros: ${resultado.total_erros || 0}`)
    } catch (error) {
      console.error('Erro ao processar lançamentos:', error)
      alert(error.message || 'Erro ao processar lançamentos')
    } finally {
      setLoadingConfig(false)
    }
  }

  const loadDadosTeste = async () => {
    try {
      setLoadingTeste(true)
      const [alunos, financeiros] = await Promise.all([
        api.obterUsuarios(),
        api.obterFinanceiro()
      ])
      setTesteAlunos(alunos)
      setTesteFinanceiros(financeiros.filter(f => !f.data_pagamento)) // Apenas não pagos
    } catch (error) {
      console.error('Erro ao carregar dados para teste:', error)
      alert('Erro ao carregar dados para teste')
    } finally {
      setLoadingTeste(false)
    }
  }

  const handleTesteWhatsApp = async () => {
    if (!testeSelecionado.financeiro) {
      alert('Por favor, selecione um lançamento financeiro para testar')
      return
    }

    if (!window.confirm('Deseja enviar uma mensagem de teste de vencimento via WhatsApp?')) {
      return
    }

    try {
      setLoadingTeste(true)
      const resultado = await api.enviarWhatsApp(parseInt(testeSelecionado.financeiro))
      alert('✅ Teste de WhatsApp enviado com sucesso!\n\nVerifique o WhatsApp do aluno.')
      console.log('Resultado do teste:', resultado)
    } catch (error) {
      console.error('Erro no teste de WhatsApp:', error)
      alert('❌ Erro ao enviar WhatsApp: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoadingTeste(false)
    }
  }

  const handleTesteCriarFinanceiro = async () => {
    if (!testeSelecionado.aluno || !testeSelecionado.valor) {
      alert('Por favor, selecione um aluno e informe um valor')
      return
    }

    if (!window.confirm(`Deseja criar um lançamento financeiro de teste?\n\nAluno: ${testeAlunos.find(a => a.idusuario === parseInt(testeSelecionado.aluno))?.nome}\nValor: R$ ${parseFloat(testeSelecionado.valor).toFixed(2)}`)) {
      return
    }

    try {
      setLoadingTeste(true)
      // Cria vencimento para o dia 10 do mês atual (igual à função automática)
      const hoje = new Date()
      const anoAtual = hoje.getFullYear()
      const mesAtual = hoje.getMonth() + 1
      
      const dataVencimento = new Date(anoAtual, mesAtual - 1, 10)
      const dataVencimentoStr = dataVencimento.toISOString().split('T')[0]

      const resultado = await api.cadastrarFinanceiro({
        idusuario: parseInt(testeSelecionado.aluno),
        valor: parseFloat(testeSelecionado.valor),
        data_vencimento: dataVencimentoStr,
        data_pagamento: null
      })

      alert('✅ Lançamento financeiro criado com sucesso!\n\nID: ' + (resultado.financeiro?.idfinanceiro || 'N/A'))
      console.log('Resultado do teste:', resultado)
      
      // Recarrega os dados
      await loadDadosTeste()
      setTesteSelecionado({ ...testeSelecionado, financeiro: resultado.financeiro?.idfinanceiro?.toString() || '' })
    } catch (error) {
      console.error('Erro no teste de criação:', error)
      alert('❌ Erro ao criar lançamento: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoadingTeste(false)
    }
  }

  const handleTesteAlterarValor = async () => {
    if (!testeSelecionado.financeiro || !testeSelecionado.valor) {
      alert('Por favor, selecione um lançamento financeiro e informe o novo valor')
      return
    }

    const financeiro = testeFinanceiros.find(f => f.idfinanceiro === parseInt(testeSelecionado.financeiro))
    if (!financeiro) {
      alert('Lançamento financeiro não encontrado')
      return
    }

    if (!window.confirm(`Deseja alterar o valor do lançamento?\n\nValor atual: R$ ${parseFloat(financeiro.valor).toFixed(2)}\nNovo valor: R$ ${parseFloat(testeSelecionado.valor).toFixed(2)}`)) {
      return
    }

    try {
      setLoadingTeste(true)
      const resultado = await api.cadastrarFinanceiro({
        idfinanceiro: parseInt(testeSelecionado.financeiro),
        idusuario: financeiro.idusuario,
        valor: parseFloat(testeSelecionado.valor),
        data_vencimento: financeiro.data_vencimento,
        data_pagamento: financeiro.data_pagamento
      })

      alert('✅ Valor alterado com sucesso!\n\nNovo valor: R$ ' + parseFloat(testeSelecionado.valor).toFixed(2))
      console.log('Resultado do teste:', resultado)
      
      // Recarrega os dados
      await loadDadosTeste()
    } catch (error) {
      console.error('Erro no teste de alteração:', error)
      alert('❌ Erro ao alterar valor: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoadingTeste(false)
    }
  }

  return (
    <>
      <ul className="nav nav-tabs nav-justified sub-menu" role="tablist">
        <li role="presentation" className={activeTab === 'configuracao' ? 'active' : ''}>
          <a
            href="#configuracao"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('configuracao')
            }}
          >
            Configuração
          </a>
        </li>
        {isAdmin() && (
          <li role="presentation" className={activeTab === 'teste' ? 'active' : ''}>
            <a
              href="#teste"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('teste')
              }}
            >
              Teste
            </a>
          </li>
        )}
      </ul>

      <div className="tab-content">
        {activeTab === 'configuracao' && (
          <div className="container-ConsultaAluno">
            <form className="container-Cadastro" onSubmit={handleSubmitConfiguracao}>
        <div className="form-grupo">
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Configurações do Sistema</h2>

          <label htmlFor="horario_funcionamento">Horário de Funcionamento</label>
          <textarea
            id="horario_funcionamento"
            name="horario_funcionamento"
            rows="6"
            value={configuracoes.horario_funcionamento}
            onChange={(e) => setConfiguracoes({ ...configuracoes, horario_funcionamento: e.target.value })}
            placeholder="Ex: Segunda a Sexta: 08:00 às 18:00&#10;Sábado: 08:00 às 12:00"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
          />

          <label htmlFor="valor_ate_vencimento">Valor do Pagamento até o Vencimento (R$)</label>
          <input
            type="number"
            id="valor_ate_vencimento"
            name="valor_ate_vencimento"
            step="0.01"
            min="0"
            required
            value={configuracoes.valor_ate_vencimento}
            onChange={(e) => setConfiguracoes({ ...configuracoes, valor_ate_vencimento: e.target.value })}
            placeholder="0.00"
          />

          <label htmlFor="valor_apos_vencimento">Valor do Pagamento após o Vencimento (R$)</label>
          <input
            type="number"
            id="valor_apos_vencimento"
            name="valor_apos_vencimento"
            step="0.01"
            min="0"
            required
            value={configuracoes.valor_apos_vencimento}
            onChange={(e) => setConfiguracoes({ ...configuracoes, valor_apos_vencimento: e.target.value })}
            placeholder="0.00"
          />

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <p><strong>ℹ️ Informações:</strong></p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Os lançamentos mensais são criados automaticamente no dia 01 de cada mês</li>
              <li>Se o dia 01 já passou do vencimento (dia 10), será usado o valor após vencimento</li>
              <li>Lançamentos existentes serão atualizados automaticamente se o valor mudar</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <input
              className="botao"
              type="submit"
              value="Salvar Configurações"
              disabled={loadingConfig}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleProcessarLancamentos}
              disabled={loadingConfig}
              style={{ padding: '10px 20px' }}
            >
              {loadingConfig ? 'Processando...' : '🔄 Processar Lançamentos Agora'}
            </button>
          </div>
        </div>
      </form>
    </div>
        )}

        {activeTab === 'teste' && isAdmin() && (
          <div className="container-ConsultaAluno">
            <div className="container-Cadastro">
              <div className="form-grupo">
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Testes do Sistema</h2>

                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  backgroundColor: '#fff3cd', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: '1px solid #ffc107'
                }}>
                  <p><strong>⚠️ Atenção:</strong> Esta área é apenas para testes. Use com cuidado!</p>
                </div>

                <label htmlFor="testeAluno">Selecione um Aluno (opcional - filtra lançamentos)</label>
                <select
                  id="testeAluno"
                  value={testeSelecionado.aluno}
                  onChange={(e) => {
                    const novoAluno = e.target.value
                    setTesteSelecionado({ 
                      ...testeSelecionado, 
                      aluno: novoAluno,
                      // Limpa a seleção de financeiro se o aluno mudar e o financeiro não pertencer ao novo aluno
                      financeiro: novoAluno && testeSelecionado.financeiro
                        ? (testeFinanceiros.find(f => 
                            f.idfinanceiro === parseInt(testeSelecionado.financeiro) && 
                            f.idusuario === parseInt(novoAluno)
                          ) ? testeSelecionado.financeiro : '')
                        : testeSelecionado.financeiro
                    })
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  disabled={loadingTeste}
                >
                  <option value="">Todos os alunos</option>
                  {testeAlunos.map((aluno) => (
                    <option key={aluno.idusuario} value={aluno.idusuario}>
                      {aluno.nome} ({aluno.usuario})
                    </option>
                  ))}
                </select>

                <label htmlFor="testeFinanceiro">Selecione um Lançamento Financeiro (para testes de WhatsApp e Alteração)</label>
                <select
                  id="testeFinanceiro"
                  value={testeSelecionado.financeiro}
                  onChange={(e) => setTesteSelecionado({ ...testeSelecionado, financeiro: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  disabled={loadingTeste}
                >
                  <option value="">Selecione um lançamento...</option>
                  {(() => {
                    // Filtra lançamentos baseado no aluno selecionado
                    const financeirosFiltrados = testeSelecionado.aluno
                      ? testeFinanceiros.filter(fin => fin.idusuario === parseInt(testeSelecionado.aluno))
                      : testeFinanceiros

                    return financeirosFiltrados.map((fin) => {
                      const aluno = testeAlunos.find(a => a.idusuario === fin.idusuario)
                      return (
                        <option key={fin.idfinanceiro} value={fin.idfinanceiro}>
                          {aluno?.nome || 'Desconhecido'} - R$ {parseFloat(fin.valor).toFixed(2)} - Venc: {fin.data_vencimento}
                        </option>
                      )
                    })
                  })()}
                </select>
                {testeSelecionado.aluno && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px', fontStyle: 'italic' }}>
                    Mostrando apenas lançamentos do aluno selecionado
                  </p>
                )}

                <label htmlFor="testeValor">Valor (R$) - Para criar ou alterar lançamento</label>
                <input
                  type="number"
                  id="testeValor"
                  step="0.01"
                  min="0"
                  value={testeSelecionado.valor}
                  onChange={(e) => setTesteSelecionado({ ...testeSelecionado, valor: e.target.value })}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />

                <div style={{ 
                  marginTop: '30px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '15px' 
                }}>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleTesteWhatsApp}
                    disabled={loadingTeste || !testeSelecionado.financeiro}
                    style={{ padding: '12px 20px', fontSize: '16px' }}
                  >
                    {loadingTeste ? '⏳ Enviando...' : '📱 Testar Envio de WhatsApp'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleTesteCriarFinanceiro}
                    disabled={loadingTeste || !testeSelecionado.aluno || !testeSelecionado.valor}
                    style={{ padding: '12px 20px', fontSize: '16px' }}
                  >
                    {loadingTeste ? '⏳ Criando...' : '➕ Testar Criação de Lançamento'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleTesteAlterarValor}
                    disabled={loadingTeste || !testeSelecionado.financeiro || !testeSelecionado.valor}
                    style={{ padding: '12px 20px', fontSize: '16px' }}
                  >
                    {loadingTeste ? '⏳ Alterando...' : '✏️ Testar Alteração de Valor'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={loadDadosTeste}
                    disabled={loadingTeste}
                    style={{ padding: '12px 20px', fontSize: '16px' }}
                  >
                    🔄 Atualizar Lista
                  </button>
                </div>

                <div style={{ 
                  marginTop: '30px', 
                  padding: '15px', 
                  backgroundColor: '#e7f3ff', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <p><strong>ℹ️ Instruções:</strong></p>
                  <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                    <li><strong>Teste WhatsApp:</strong> Seleciona um lançamento e envia mensagem de vencimento</li>
                    <li><strong>Teste Criação:</strong> Seleciona um aluno e valor, cria um novo lançamento (vencimento em 10 dias)</li>
                    <li><strong>Teste Alteração:</strong> Seleciona um lançamento e novo valor, atualiza o valor</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Configuracoes

