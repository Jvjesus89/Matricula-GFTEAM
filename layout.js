function loadHTML(id, file, callback) {
  const container = document.getElementById(id);
  if (!container) {
    console.warn(`Elemento com id '${id}' não encontrado.`);
    return;
  }

  fetch(file)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Arquivo '${file}' não encontrado.`);
      }
      return response.text();
    })
    .then(data => {
      container.innerHTML = data;
      if (callback) callback();
    })
    .catch(error => console.error(`Erro ao carregar: ${file}`, error));
}

window.onload = function () {
  loadHTML("header-placeholder", "header.html", setActiveMenu);
  loadHTML("footer-placeholder", "footer.html");
};

function setActiveMenu() {
  const currentPage = window.location.pathname.split("/").pop();
  const menuLinks = document.querySelectorAll("ul.nav-tabs li a");

  menuLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.parentElement.classList.add("active");
    } else {
      link.parentElement.classList.remove("active");
    }
  });
}
