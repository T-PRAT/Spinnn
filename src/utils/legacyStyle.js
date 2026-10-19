// L'app a un nouveau style par défaut (theme-maquette.css). L'ancien se retrouve en ouvrant
// l'app avec ?style=ancien ; la classe reste sur <html> jusqu'au rechargement de la page.
if (new URLSearchParams(window.location.search).get('style') === 'ancien') {
  document.documentElement.classList.add('style-ancien');
}
