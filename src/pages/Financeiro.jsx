import { useState, useEffect, useMemo } from 'react'
import DataTable from 'react-data-table-component'
// import Plot from 'react-plotly.js' // Comentado temporariamente
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import Modal from '../components/Modal'
import ComprovantePagamento from '../components/ComprovantePagamento'
import '../styles/Financeiro.css'

function Financeiro() {
  const { user, isAdmin, isResponsavel, getAlunos } = useAuth()
  const [activeTab, setActiveTab] = useState('cadastro')
  const [financeiros, setFinanceiros] = useState([])
  const [alunos, setAlunos] = useState([])
  const [alunoSelecionado, setAlunoSelecionado] = useState(null) // Para responsável selecionar qual aluno ver
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [comprovanteOpen, setComprovanteOpen] = useState(false)
  const [financeiroSelecionado, setFinanceiroSelecionado] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [formData, setFormData] = useState({
    Aluno: '',
    Valor: '',
    DataVencimento: '',
    DataPagamento: '',
  })
  const [graficos, setGraficos] = useState({
    mensal: null,
    status: null,
    alunos: null,
    valor: null,
  })

  useEffect(() => {
    // Se for responsável e tiver alunos, seleciona o primeiro por padrão
    if (isResponsavel()) {
      const alunosResponsavel = getAlunos()
      if (alunosResponsavel.length > 0 && !alunoSelecionado) {
        setAlunoSelecionado(alunosResponsavel[0].idusuario)
      }
    }
    
    loadAlunos()
    loadData()
  }, [])

  // Recarrega dados quando aluno selecionado mudar (para responsável)
  useEffect(() => {
    if (isResponsavel() && alunoSelecionado) {
      loadData()
    }
  }, [alunoSelecionado])

  useEffect(() => {
    if (activeTab === 'graficos') {
      loadGraficos()
    }
  }, [activeTab, financeiros])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await api.obterFinanceiro()
      let filtered = data

      // Se for admin, mostra tudo
      if (isAdmin()) {
        filtered = data
      } 
      // Se for responsável, mostra os alunos vinculados
      else if (isResponsavel()) {
        const alunosResponsavel = getAlunos()
        const idsAlunos = alunosResponsavel.map((a) => a.idusuario)
        // Se tiver aluno selecionado, mostra apenas dele, senão mostra todos
        if (alunoSelecionado) {
          filtered = data.filter((item) => item.idusuario === alunoSelecionado)
        } else {
          filtered = data.filter((item) => idsAlunos.includes(item.idusuario))
        }
      } 
      // Se for aluno, mostra apenas seus próprios registros
      else {
        filtered = data.filter((item) => item.idusuario === user?.idusuario)
      }

      setFinanceiros(filtered)
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
      alert('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const loadAlunos = async () => {
    try {
      // Se for responsável, carrega apenas os alunos vinculados
      if (isResponsavel()) {
        const alunosResponsavel = getAlunos()
        setAlunos(alunosResponsavel)
      } 
      // Se for admin, carrega todos os alunos
      else if (isAdmin()) {
        const data = await api.obterUsuarios()
        setAlunos(data)
      } 
      // Se for aluno, carrega apenas ele mesmo
      else {
        setAlunos(user ? [user] : [])
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
    }
  }

  const loadGraficos = () => {
    // Lógica para gerar gráficos (similar ao graficos.js original)
    // Por enquanto, deixamos vazio - pode ser implementado depois
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const data = {
        idusuario: formData.Aluno,
        valor: parseFloat(formData.Valor),
        data_vencimento: formData.DataVencimento,
        data_pagamento: formData.DataPagamento || null,
      }

      await api.cadastrarFinanceiro(data)
      setModalOpen(false)
      resetForm()
      loadData()
      alert('Pagamento cadastrado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error)
      alert(error.message || 'Erro ao salvar pagamento')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este pagamento?')) return

    try {
      await api.excluirFinanceiro(id)
      loadData()
      alert('Pagamento excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error)
      alert(error.message || 'Erro ao excluir pagamento')
    }
  }

  const handleFiltrar = () => {
    // Lógica de filtro por data
    loadData()
  }

  const resetForm = () => {
    setFormData({
      Aluno: '',
      Valor: '',
      DataVencimento: '',
      DataPagamento: '',
    })
  }

  const filteredFinanceiros = useMemo(() => {
    let filtered = financeiros

    if (filterText) {
      const search = filterText.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.usuario?.toLowerCase().includes(search) ||
          item.nome?.toLowerCase().includes(search) ||
          item.valor?.toString().includes(search)
      )
    }

    if (dataInicial) {
      filtered = filtered.filter((item) => item.data_vencimento >= dataInicial)
    }

    if (dataFinal) {
      filtered = filtered.filter((item) => item.data_vencimento <= dataFinal)
    }

    return filtered
  }, [financeiros, filterText, dataInicial, dataFinal])

  const columns = [
    {
      name: 'Usuário',
      selector: (row) => row.usuario || '-',
      sortable: true,
    },
    {
      name: 'Nome do Aluno',
      selector: (row) => row.nome || '-',
      sortable: true,
    },
    {
      name: 'Valor',
      selector: (row) => `R$ ${parseFloat(row.valor || 0).toFixed(2)}`,
      sortable: true,
    },
    {
      name: 'Data de Vencimento',
      selector: (row) => row.data_vencimento || '-',
      sortable: true,
    },
    {
      name: 'Data de Pagamento',
      selector: (row) => row.data_pagamento || '-',
      sortable: true,
    },
    {
      name: 'Ações',
      cell: (row) => {
        const actions = []

        if (row.data_pagamento) {
          actions.push(
            <button
              key="print"
              onClick={() => {
                setFinanceiroSelecionado(row)
                setComprovanteOpen(true)
              }}
              className="btn btn-success btn-sm"
              style={{ marginRight: '5px' }}
            >
              🖨️
            </button>
          )
        } else {
          actions.push(
            <button
              key="whatsapp"
              onClick={() => api.enviarWhatsApp(row.idfinanceiro)}
              className="btn btn-success btn-sm"
              style={{ marginRight: '5px' }}
            >
              📱
            </button>
          )
        }

        if (isAdmin()) {
          actions.push(
            <button
              key="delete"
              onClick={() => handleDelete(row.idfinanceiro)}
              className="btn btn-danger btn-sm"
            >
              🗑️
            </button>
          )
        }

        return <div className="btn-group" style={{ display: 'flex', gap: '5px' }}>{actions}</div>
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '150px', // Aumenta a largura da coluna de ações
    },
  ]

  return (
    <>
      <ul className="nav nav-tabs nav-justified sub-menu" role="tablist">
        <li role="presentation" className={activeTab === 'cadastro' ? 'active' : ''}>
          <a
            href="#cadastro"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('cadastro')
            }}
          >
            Cadastro Financeiro
          </a>
        </li>
        {isAdmin() && (
          <li role="presentation" className={activeTab === 'graficos' ? 'active' : ''}>
            <a
              href="#graficos"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('graficos')
              }}
            >
              Gráficos
            </a>
          </li>
        )}
      </ul>

      <div className="tab-content">
        {activeTab === 'cadastro' && (
          <div className="container-ConsultaAluno">
            <div className="topo-tabela">
              <div className="dataTables_filter" style={{ flex: 1, minWidth: '300px', order: 1 }}>
                <input
                  type="search"
                  placeholder="Buscar por nome, usuário, telefone..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              
              {/* Seletor de aluno para responsável */}
              {isResponsavel() && getAlunos().length > 1 && (
                <div style={{ order: 2, marginRight: '10px' }}>
                  <label htmlFor="selectAlunoResponsavel" style={{ marginRight: '8px', fontWeight: 'bold' }}>
                    Aluno:
                  </label>
                  <select
                    id="selectAlunoResponsavel"
                    value={alunoSelecionado || ''}
                    onChange={(e) => setAlunoSelecionado(parseInt(e.target.value, 10))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Todos os alunos</option>
                    {getAlunos().map((aluno) => (
                      <option key={aluno.idusuario} value={aluno.idusuario}>
                        {aluno.nome} ({aluno.usuario})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(isAdmin() || (isResponsavel() && getAlunos().length > 0)) && (
                <div className="botao" style={{ order: 3 }}>
                  <button
                    id="btnCadastrarFinanceiro"
                    className="btn btn-primary"
                    onClick={() => setModalOpen(true)}
                  >
                    <span style={{ marginRight: '8px' }}>➕</span>Cadastrar Pagamento
                  </button>
                </div>
              )}
              <div className="filtro-data" style={{ order: 3, width: '100%', marginTop: '15px' }}>
                <div className="row">
                  <div className="col-md-4">
                    <label htmlFor="dataInicial">Data Inicial:</label>
                    <input
                      type="date"
                      id="dataInicial"
                      className="form-control"
                      value={dataInicial}
                      onChange={(e) => setDataInicial(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="dataFinal">Data Final:</label>
                    <input
                      type="date"
                      id="dataFinal"
                      className="form-control"
                      value={dataFinal}
                      onChange={(e) => setDataFinal(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button id="btnFiltrar" className="btn btn-primary" onClick={handleFiltrar}>
                      Filtrar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredFinanceiros}
              progressPending={loading}
              pagination
              paginationPerPage={25}
              noDataComponent="Nenhum registro encontrado"
              highlightOnHover
              striped
              customStyles={{
                headRow: {
                  style: {
                    backgroundColor: '#000',
                    color: '#ffffff',
                  },
                },
                headCells: {
                  style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  },
                },
              }}
            />
          </div>
        )}

        {activeTab === 'graficos' && isAdmin() && (
          <div className="container-graficos">
            <h2>Gráficos Financeiros</h2>
            <div className="row">
              <div className="col-md-6">
                <div id="grafico-mensal" style={{ height: '300px' }}></div>
              </div>
              <div className="col-md-6">
                <div id="grafico-status" style={{ height: '300px' }}></div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div id="grafico-alunos" style={{ height: '300px' }}></div>
              </div>
              <div className="col-md-6">
                <div id="grafico-valor" style={{ height: '300px' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title="Cadastrar Pagamento"
      >
        <form className="container-Cadastro" id="form-financeiro" onSubmit={handleSubmit}>
          <div className="form-grupo">
            <label htmlFor="Aluno">Selecione o Aluno</label>
            <select
              name="Aluno"
              id="selectAluno"
              required
              value={formData.Aluno}
              onChange={(e) => setFormData({ ...formData, Aluno: e.target.value })}
            >
              <option value="">Selecione um aluno...</option>
              {alunos.map((aluno) => (
                <option key={aluno.idusuario} value={aluno.idusuario}>
                  {aluno.nome} ({aluno.usuario})
                </option>
              ))}
            </select>
            
            {/* Se for responsável e tiver apenas um aluno, pré-seleciona */}
            {isResponsavel() && getAlunos().length === 1 && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px' }}>
                Aluno: {getAlunos()[0].nome}
              </p>
            )}

            <label htmlFor="Valor">Valor</label>
            <input
              type="number"
              name="Valor"
              step="0.01"
              required
              value={formData.Valor}
              onChange={(e) => setFormData({ ...formData, Valor: e.target.value })}
            />

            <label htmlFor="DataVencimento">Data de Vencimento</label>
            <input
              type="date"
              name="DataVencimento"
              required
              value={formData.DataVencimento}
              onChange={(e) => setFormData({ ...formData, DataVencimento: e.target.value })}
            />

            <label htmlFor="DataPagamento">Data de Pagamento</label>
            <input
              type="date"
              name="DataPagamento"
              value={formData.DataPagamento}
              onChange={(e) => setFormData({ ...formData, DataPagamento: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input className="botao" type="submit" value="Cadastrar" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Comprovante de Pagamento */}
      {comprovanteOpen && (
        <ComprovantePagamento
          financeiro={financeiroSelecionado}
          onClose={() => {
            setComprovanteOpen(false)
            setFinanceiroSelecionado(null)
          }}
        />
      )}
    </>
  )
}

export default Financeiro

