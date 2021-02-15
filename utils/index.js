module.exports = {
  matchFilm: (films, searchInput) => {
    const regexp = new RegExp(searchInput, "gi");
    const matchFilms = films.filter((film) => regexp.test(film));
    console.log(matchFilms);
    return matchFilms;
  },
  //isAdmin: user => user.role.includes('ADMIN'),
  isUser: (user) => user.role.includes("USER")
};