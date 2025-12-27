import '../styles/Principal.css'

function Principal() {
  return (
    <div className="container-Principal">
      <h1>Bem-vindo à GF TEAM</h1>
      <br />
      <ul>
        <strong>Horarios Kids: </strong>
        <li>Infantil de 11 a 15 anos: Segunda, Quarta e Sexta das 18:30 às 19:30</li>
        <li>Infantil de 04 a 10 anos: Terça e Quinta das 18:30 às 19:30</li>
      </ul>
      <ul>
        <strong>Horarios Adulto: </strong>
        <li>Segunda, quarta e sexta-feira das 08:30 às 09:30</li>
        <li>Segunda a Sexta das 20:00 às 21:30</li>
      </ul>
    </div>
  )
}

export default Principal

