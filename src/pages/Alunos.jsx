import { useState, useEffect, useMemo } from 'react'
import DataTable from 'react-data-table-component'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import Modal from '../components/Modal'
import { formatPhone } from '../utils/formatPhone'
import { generateUsernameQuick, generateUsername } from '../utils/generateUsername'
import '../styles/Alunos.css'

function Alunos() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('aluno')
  const [usuarios, setUsuarios] = useState([])
  const [responsaveis, setResponsaveis] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalResponsavelOpen, setModalResponsavelOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingResponsavel, setEditingResponsavel] = useState(null)
  const [perfis, setPerfis] = useState([])
  const [filterText, setFilterText] = useState('')
  const [formData, setFormData] = useState({
    usuario: '',
    idresponsavel: '',
    NomeAluno: '',
    Idade: '',
    Telefone: '',
    Senha: '',
    perfil: '',
    faixa: '',
    datanascimento: '',
    endereco: '',
    documento: '',
    email: '',
    nomesresponsaveis: '',
    usamedicamento: false,
  })

  // Função para calcular idade a partir da data de nascimento
  function calcularIdade(dataNascStr) {
    if (!dataNascStr) return '';
    const hoje = new Date();
    const partes = dataNascStr.split('-');
    if (partes.length !== 3) return '';
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const nascimento = new Date(ano, mes, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade.toString() : '';
  }
  const [formResponsavel, setFormResponsavel] = useState({
    nome: '',
    telefone: '',
    email: '',
    usuario: '',
    senha: '',
    idperfilusuario: '',
  })

  useEffect(() => {
    loadData()
    loadPerfis()
    loadResponsaveis()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await api.obterUsuarios()
      setUsuarios(data)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      alert('Erro ao carregar lista de usuários')
    } finally {
      setLoading(false)
    }
  }

  const loadPerfis = async () => {
    try {
      const data = await api.obterPerfis()
      setPerfis(data)
    } catch (error) {
      console.error('Erro ao carregar perfis:', error)
    }
  }

  const loadResponsaveis = async () => {
    try {
      const data = await api.obterResponsaveis()
      setResponsaveis(data)
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Converte o perfil para número inteiro
      const perfilId = formData.perfil ? parseInt(formData.perfil) : null
      
      if (!perfilId) {
        alert('Por favor, selecione um perfil')
        return
      }

      const data = {
        usuario: formData.usuario,
        idresponsavel: formData.idresponsavel || null,
        nome: formData.NomeAluno,
        idade: parseInt(formData.Idade) || null,
        telefone: formData.Telefone,
        senha: formData.Senha,
        perfil: perfilId,
        faixa: formData.faixa || null,
        datanascimento: formData.datanascimento || null,
        endereco: formData.endereco || null,
        documento: formData.documento || null,
        email: formData.email || null,
        nomesresponsaveis: formData.nomesresponsaveis || null,
        usamedicamento: formData.usamedicamento || false,
      }

      if (editingUser) {
        data.idusuario = editingUser.idusuario
        await api.atualizarUsuario(data)
      } else {
        await api.cadastrarUsuario(data)
      }

      setModalOpen(false)
      resetForm()
      loadData()
      loadResponsaveis() // Recarrega responsáveis após cadastrar aluno
      alert(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      alert(error.message || 'Erro ao salvar usuário')
    }
  }

  const handleSubmitResponsavel = async (e) => {
    e.preventDefault()

    try {
      if (editingResponsavel) {
        const data = {
          idresponsavel: editingResponsavel.idresponsavel,
          ...formResponsavel,
        }
        await api.atualizarResponsavel(data)
        alert('Responsável atualizado com sucesso!')
      } else {
        const response = await api.cadastrarResponsavel(formResponsavel)
        // Seleciona o responsável recém-cadastrado no formulário de aluno se o modal estiver aberto
        if (modalOpen && response?.responsavel?.idresponsavel) {
          setFormData({ ...formData, idresponsavel: response.responsavel.idresponsavel.toString() })
        }
        alert('Responsável cadastrado com sucesso!')
      }
      setModalResponsavelOpen(false)
      resetFormResponsavel()
      await loadResponsaveis()
    } catch (error) {
      console.error('Erro ao salvar responsável:', error)
      alert(error.message || 'Erro ao salvar responsável')
    }
  }

  const handleEditResponsavel = (responsavel) => {
    setEditingResponsavel(responsavel)
    setFormResponsavel({
      nome: responsavel.nome || '',
      telefone: responsavel.telefone || '',
      email: responsavel.email || '',
      usuario: responsavel.usuario || '',
      senha: '', // Não preenche senha por segurança
      idperfilusuario: responsavel.idperfilusuario?.toString() || '',
    })
    setModalResponsavelOpen(true)
  }

  const handleDeleteResponsavel = async (idresponsavel) => {
    if (!window.confirm('Tem certeza que deseja excluir este responsável?')) return

    try {
      await api.excluirResponsavel(idresponsavel)
      await loadResponsaveis()
      alert('Responsável excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir responsável:', error)
      alert(error.message || 'Erro ao excluir responsável')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    // Busca o ID do perfil do usuário
    // A chave primária de usuario_perfil é idperfilusuario
    let perfilId = ''
    
    if (user.idperfilusuario) {
      perfilId = user.idperfilusuario.toString()
    } else if (user.usuario_perfil) {
      // Se não tiver idperfilusuario direto, busca pelo relacionamento
      if (user.usuario_perfil.idperfilusuario) {
        perfilId = user.usuario_perfil.idperfilusuario.toString()
      } else {
        // Fallback: busca pelo nome do perfil
        const perfilEncontrado = perfis.find((p) => p.perfil === user.usuario_perfil.perfil)
        perfilId = perfilEncontrado?.idperfilusuario?.toString() || ''
      }
    }
    
    setFormData({
      usuario: user.usuario || '',
      idresponsavel: user.idresponsavel?.toString() || '',
      NomeAluno: user.nome || '',
      Idade: user.idade?.toString() || '',
      Telefone: user.telefone || '',
      Senha: '',
      perfil: perfilId,
      faixa: user.faixa || '',
      datanascimento: user.datanascimento || '',
      endereco: user.endereco || '',
      documento: user.documento || '',
      email: user.email || '',
      nomesresponsaveis: user.nomesresponsaveis || '',
      usamedicamento: user.usamedicamento || false,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      await api.excluirUsuario(id)
      loadData()
      alert('Usuário excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert(error.message || 'Erro ao excluir usuário')
    }
  }

  const resetForm = () => {
    setFormData({
      usuario: '',
      idresponsavel: '',
      NomeAluno: '',
      Idade: '',
      Telefone: '',
      Senha: '',
      perfil: '',
      faixa: '',
      datanascimento: '',
      endereco: '',
      documento: '',
      email: '',
      nomesresponsaveis: '',
      usamedicamento: false,
    })
    setEditingUser(null)
  }

  const resetFormResponsavel = () => {
    setFormResponsavel({
      nome: '',
      telefone: '',
      email: '',
      usuario: '',
      senha: '',
      idperfilusuario: '',
    })
    setEditingResponsavel(null)
  }

  const handleOpenModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const handleOpenModalResponsavel = () => {
    resetFormResponsavel()
    setModalResponsavelOpen(true)
  }

  const filteredUsuarios = useMemo(() => {
    if (!filterText) return usuarios

    const search = filterText.toLowerCase()
    return usuarios.filter(
      (user) =>
        user.usuario?.toLowerCase().includes(search) ||
        user.nome?.toLowerCase().includes(search) ||
        user.telefone?.includes(search)
    )
  }, [usuarios, filterText])

  const columns = [
    {
      name: 'Usuário',
      selector: (row) => row.usuario,
      sortable: true,
    },
    {
      name: 'Responsável',
      selector: (row) => {
        // Se tiver relacionamento responsaveis, usa ele
        if (row.responsaveis?.nome) {
          return row.responsaveis.nome
        }
        // Caso contrário, retorna o ID do responsável ou '-'
        return row.idresponsavel ? `ID: ${row.idresponsavel}` : '-'
      },
      sortable: true,
    },
    {
      name: 'Nome',
      selector: (row) => row.nome,
      sortable: true,
    },
    {
      name: 'Faixa',
      selector: (row) => row.faixa || '-',
      sortable: true,
    },
    {
      name: 'Idade',
      selector: (row) => row.idade || '-',
      sortable: true,
    },
    {
      name: 'Telefone',
      selector: (row) => row.telefone || '-',
      sortable: true,
    },
    {
      name: 'Documento',
      selector: (row) => row.documento || '-',
      sortable: true,
    },
    {
      name: 'Medicamento',
      selector: (row) => row.usamedicamento ? 'Sim' : 'Não',
      sortable: true,
    },
    {
      name: 'Perfil',
      selector: (row) => row.usuario_perfil?.perfil || 'Não definido',
      sortable: true,
    },
    {
      name: 'Ações',
      cell: (row) =>
        isAdmin() ? (
          <div className="btn-group" style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => handleEdit(row)}
              className="btn btn-primary btn-sm"
              style={{ marginRight: '5px' }}
            >
              ✏️
            </button>
            <button onClick={() => handleDelete(row.idusuario)} className="btn btn-danger btn-sm">
              🗑️
            </button>
          </div>
        ) : null,
      ignoreRowClick: true,
      width: '150px', // Aumenta a largura da coluna de ações
    },
  ]

  const columnsResponsaveis = [
    {
      name: 'Nome',
      selector: (row) => row.nome,
      sortable: true,
    },
    {
      name: 'Telefone',
      selector: (row) => row.telefone || '-',
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row) => row.email || '-',
      sortable: true,
    },
    {
      name: 'Usuário',
      selector: (row) => row.usuario || '-',
      sortable: true,
    },
    {
      name: 'Ações',
      cell: (row) =>
        isAdmin() ? (
          <div className="btn-group" style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => handleEditResponsavel(row)}
              className="btn btn-primary btn-sm"
              style={{ marginRight: '5px' }}
            >
              ✏️
            </button>
            <button
              onClick={() => handleDeleteResponsavel(row.idresponsavel)}
              className="btn btn-danger btn-sm"
            >
              🗑️
            </button>
          </div>
        ) : null,
      ignoreRowClick: true,
      width: '150px', // Aumenta a largura da coluna de ações
    },
  ]

  return (
    <>
      <ul className="nav nav-tabs nav-justified sub-menu" role="tablist">
        <li role="presentation" className={activeTab === 'aluno' ? 'active' : ''}>
          <a
            href="#aluno"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('aluno')
            }}
          >
            Cadastro de Aluno
          </a>
        </li>
        <li role="presentation" className={activeTab === 'responsavel' ? 'active' : ''}>
          <a
            href="#responsavel"
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('responsavel')
            }}
          >
            Cadastro de Responsável
          </a>
        </li>
      </ul>

      <div className="tab-content">
        {activeTab === 'aluno' && (
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
              {isAdmin() && (
                <div className="botao" style={{ order: 2 }}>
                  <button id="btnCadastrarAluno" className="btn btn-primary" onClick={handleOpenModal}>
                    <span style={{ marginRight: '8px' }}>➕</span>Cadastrar Aluno
                  </button>
                </div>
              )}
            </div>

            <DataTable
              columns={columns}
              data={filteredUsuarios}
              progressPending={loading}
              pagination
              paginationPerPage={25}
              noDataComponent="Nenhum usuário encontrado"
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

            <Modal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false)
                resetForm()
              }}
              title={editingUser ? 'Editar Aluno' : 'Cadastrar Aluno'}
            >
              <form className="container-Cadastro form-cadastro-duas-colunas" id="form-aluno" onSubmit={handleSubmit}>
                <div className="form-grupo form-grupo-duas-colunas">

                  <div className="duas-colunas">
                    <div className="coluna">
                      <label htmlFor="usuario">Usuario</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          name="usuario"
                          autoComplete="username"
                          value={formData.usuario}
                          onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                          required
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={async () => {
                            const nomeCompleto = formData.NomeAluno
                            if (!nomeCompleto || nomeCompleto.trim() === '') {
                              alert('Por favor, preencha o nome do aluno primeiro')
                              return
                            }
                            // Gera sugestão rápida primeiro
                            const sugestaoRapida = generateUsernameQuick(nomeCompleto)
                            setFormData({ ...formData, usuario: sugestaoRapida })
                            // Depois verifica disponibilidade e gera uma melhor se necessário
                            try {
                              const sugestaoCompleta = await generateUsername(nomeCompleto, async (usuario) => {
                                return await api.verificarUsuario(usuario)
                              })
                              if (sugestaoCompleta !== sugestaoRapida) {
                                setFormData({ ...formData, usuario: sugestaoCompleta })
                              }
                            } catch (error) {
                              console.error('Erro ao gerar sugestão completa:', error)
                              // Mantém a sugestão rápida se der erro
                            }
                          }}
                          style={{ whiteSpace: 'nowrap', height: '38px', padding: '8px 16px' }}
                          title="Gerar sugestão de usuário baseado no nome"
                        >
                          ✨ Gerar
                        </button>
                      </div>
                    </div>
                    <div className="coluna">
                      <label htmlFor="idresponsavel" style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#333' }}>
                        Responsável
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                          name="idresponsavel"
                          id="idresponsavel"
                          value={formData.idresponsavel}
                          onChange={(e) => setFormData({ ...formData, idresponsavel: e.target.value })}
                          style={{ 
                            flex: 1, 
                            height: '38px',
                            minWidth: '200px',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            border: '2px solid #e0e0e0',
                            fontSize: '15px',
                            backgroundColor: '#ffffff',
                            color: '#333',
                            cursor: 'pointer',
                            transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                          }}
                        >
                          <option value="">Selecione um responsável</option>
                          {responsaveis.map((resp, index) => (
                            <option 
                              key={resp.idresponsavel || `resp-${index}`} 
                              value={resp.idresponsavel}
                              title={`${resp.nome} ${resp.telefone ? `(${resp.telefone})` : ''}`}
                            >
                              {resp.nome} {resp.telefone ? `(${resp.telefone})` : ''}
                            </option>
                          ))}
                        </select>
                        {isAdmin() && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleOpenModalResponsavel}
                            style={{ 
                              whiteSpace: 'nowrap', 
                              height: '38px', 
                              padding: '8px 16px',
                              borderRadius: '8px',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #e0e0e0',
                              color: '#333',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: '500'
                            }}
                          >
                            <span style={{ color: '#6f42c1', fontSize: '18px' }}>➕</span> Novo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>


                  <div className="duas-colunas">
                    <div className="coluna">
                      <label htmlFor="NomeAluno">Nome Aluno</label>
                      <input
                        type="text"
                        name="NomeAluno"
                        autoComplete="name"
                        value={formData.NomeAluno}
                        onChange={(e) => setFormData({ ...formData, NomeAluno: e.target.value })}
                        required
                      />
                    </div>
                    <div className="coluna">
                      <label htmlFor="faixa">Faixa</label>
                      <select
                        name="faixa"
                        id="faixa"
                        value={formData.faixa}
                        onChange={(e) => setFormData({ ...formData, faixa: e.target.value })}
                      >
                        <option value="">Selecione uma faixa</option>
                        <option value="Adulto">Adulto</option>
                        <option value="Kids">Kids</option>
                        <option value="Iniciantes">Iniciantes</option>
                        <option value="Juvenil">Juvenil</option>
                      </select>
                    </div>
                  </div>


                  <div className="duas-colunas">
                    <div className="coluna">
                      <label htmlFor="datanascimento">Data de Nascimento</label>
                      <input
                        type="date"
                        name="datanascimento"
                        value={formData.datanascimento}
                        onChange={(e) => {
                          const novaData = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            datanascimento: novaData,
                            Idade: calcularIdade(novaData)
                          }));
                        }}
                      />
                    </div>
                    <div className="coluna">
                      <label htmlFor="Idade">Idade</label>
                      <input
                        type="number"
                        name="Idade"
                        autoComplete="age"
                        value={formData.Idade}
                        onChange={(e) => setFormData({ ...formData, Idade: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="duas-colunas">
                    <div className="coluna">
                      <label htmlFor="endereco">Endereço</label>
                      <input
                        type="text"
                        name="endereco"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      />
                    </div>
                    <div className="coluna">
                      <label htmlFor="Telefone">Telefone</label>
                      <input
                        type="text"
                        name="Telefone"
                        maxLength={15}
                        placeholder="(99) 99999-9999"
                        autoComplete="tel"
                        value={formData.Telefone}
                        onChange={(e) => setFormData({ ...formData, Telefone: formatPhone(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="duas-colunas">
                    <div className="coluna">
                      <label htmlFor="documento">Documento (CPF)</label>
                      <input
                        type="text"
                        name="documento"
                        placeholder="000.000.000-00"
                        value={formData.documento}
                        onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      />
                    </div>
                    <div className="coluna">
                      <label htmlFor="email">E-mail</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>


                  {!editingUser && (
                    <>
                      <label htmlFor="Senha">Senha</label>
                      <input
                        type="password"
                        name="Senha"
                        autoComplete="current-password"
                        value={formData.Senha}
                        onChange={(e) => setFormData({ ...formData, Senha: e.target.value })}
                        required
                      />
                    </>
                  )}

                  <label htmlFor="nomesresponsaveis">Nome dos Responsáveis</label>
                  <input
                    type="text"
                    name="nomesresponsaveis"
                    value={formData.nomesresponsaveis}
                    onChange={(e) => setFormData({ ...formData, nomesresponsaveis: e.target.value })}
                  />


                  <div className="duas-colunas">
                    <div className="coluna" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label htmlFor="usamedicamento" style={{ marginbutton: 100, fontWeight: 500 }}>
                        Faz uso de algum medicamento
                      </label>
                      <input
                        type="checkbox"
                        name="usamedicamento"
                        checked={formData.usamedicamento}
                        onChange={(e) => setFormData({ ...formData, usamedicamento: e.target.checked })}
                        id="usamedicamento"
                        style={{ marginRight: '8px' }}
                      />
                    </div>
                    <div className="coluna">
                      <label htmlFor="perfil">Perfil</label>
                      <select
                        name="perfil"
                        id="perfil"
                        required
                        value={formData.perfil}
                        onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                      >
                        <option value="">Selecione um perfil</option>
                        {perfis.map((perfil) => (
                          <option key={perfil.idperfilusuario} value={perfil.idperfilusuario}>
                            {perfil.perfil}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input className="botao" type="submit" value={editingUser ? 'Atualizar' : 'Cadastrar'} />
                  </div>
                </div>
              </form>
            </Modal>
          </div>
        )}

        {activeTab === 'responsavel' && (
          <div className="container-ConsultaAluno">
            <div className="topo-tabela">
              {isAdmin() && (
                <div className="botao" style={{ marginLeft: 'auto' }}>
                  <button
                    id="btnCadastrarResponsavel"
                    className="btn btn-primary"
                    onClick={handleOpenModalResponsavel}
                  >
                    <span style={{ marginRight: '8px' }}>➕</span>Cadastrar Responsável
                  </button>
                </div>
              )}
            </div>

            <DataTable
              columns={columnsResponsaveis}
              data={responsaveis}
              progressPending={loading}
              pagination
              paginationPerPage={25}
              noDataComponent="Nenhum responsável encontrado"
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

            <Modal
              isOpen={modalResponsavelOpen}
              onClose={() => {
                setModalResponsavelOpen(false)
                resetFormResponsavel()
              }}
              title={editingResponsavel ? 'Editar Responsável' : 'Cadastrar Responsável'}
            >
              <form className="container-Cadastro" id="form-responsavel" onSubmit={handleSubmitResponsavel}>
                <div className="form-grupo">
                  <label htmlFor="nomeResponsavel">Nome</label>
                  <input
                    type="text"
                    name="nomeResponsavel"
                    required
                    value={formResponsavel.nome}
                    onChange={(e) => setFormResponsavel({ ...formResponsavel, nome: e.target.value })}
                  />

                  <label htmlFor="telefoneResponsavel">Telefone</label>
                  <input
                    type="text"
                    name="telefoneResponsavel"
                    maxLength={15}
                    placeholder="(99) 99999-9999"
                    value={formResponsavel.telefone}
                    onChange={(e) =>
                      setFormResponsavel({ ...formResponsavel, telefone: formatPhone(e.target.value) })
                    }
                  />

                  <label htmlFor="emailResponsavel">Email</label>
                  <input
                    type="email"
                    name="emailResponsavel"
                    value={formResponsavel.email}
                    onChange={(e) => setFormResponsavel({ ...formResponsavel, email: e.target.value })}
                  />

                  <label htmlFor="usuarioResponsavel">Usuário (Login) - Opcional</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      name="usuarioResponsavel"
                      value={formResponsavel.usuario}
                      onChange={(e) => setFormResponsavel({ ...formResponsavel, usuario: e.target.value })}
                      placeholder="Deixe em branco se não quiser criar login"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={async () => {
                        const nomeCompleto = formResponsavel.nome
                        if (!nomeCompleto || nomeCompleto.trim() === '') {
                          alert('Por favor, preencha o nome do responsável primeiro')
                          return
                        }
                        // Gera sugestão rápida primeiro
                        const sugestaoRapida = generateUsernameQuick(nomeCompleto)
                        setFormResponsavel({ ...formResponsavel, usuario: sugestaoRapida })
                        // Depois verifica disponibilidade e gera uma melhor se necessário
                        try {
                          const sugestaoCompleta = await generateUsername(nomeCompleto, async (usuario) => {
                            return await api.verificarUsuario(usuario)
                          })
                          if (sugestaoCompleta !== sugestaoRapida) {
                            setFormResponsavel({ ...formResponsavel, usuario: sugestaoCompleta })
                          }
                        } catch (error) {
                          console.error('Erro ao gerar sugestão completa:', error)
                        }
                      }}
                      style={{ whiteSpace: 'nowrap', height: '38px', padding: '8px 16px' }}
                      title="Gerar sugestão de usuário baseado no nome"
                    >
                      ✨ Gerar
                    </button>
                  </div>

                  <label htmlFor="senhaResponsavel">
                    Senha {editingResponsavel ? '(deixe em branco para não alterar)' : '- Opcional'}
                  </label>
                  <input
                    type="password"
                    name="senhaResponsavel"
                    value={formResponsavel.senha}
                    onChange={(e) => setFormResponsavel({ ...formResponsavel, senha: e.target.value })}
                    placeholder={editingResponsavel ? 'Deixe em branco para não alterar' : 'Necessária se informar usuário'}
                    disabled={!formResponsavel.usuario}
                  />

                  {formResponsavel.usuario && (
                    <>
                      <label htmlFor="perfilResponsavel">Perfil - Opcional</label>
                      <select
                        name="perfilResponsavel"
                        id="perfilResponsavel"
                        value={formResponsavel.idperfilusuario}
                        onChange={(e) => setFormResponsavel({ ...formResponsavel, idperfilusuario: e.target.value })}
                      >
                        <option value="">Selecione um perfil (opcional)</option>
                        {perfis.map((perfil) => (
                          <option key={perfil.idperfilusuario} value={perfil.idperfilusuario}>
                            {perfil.perfil}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input
                      className="botao"
                      type="submit"
                      value={editingResponsavel ? 'Atualizar' : 'Cadastrar'}
                    />
                  </div>
                </div>
              </form>
            </Modal>
          </div>
        )}
      </div>
    </>
  )
}

export default Alunos
