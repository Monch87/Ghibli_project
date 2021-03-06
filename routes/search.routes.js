const express = require("express")
const { checkLoggedIn } = require("./../middleware")

const Movie = require("../models/movie.model")
const Rating = require("../models/rating.model")
const User = require("../models/user.model")
const router = express.Router()
const apiHandler = require("../services")

// Endpoints

// Movie details
router.get("/movie/:id", async (req, res, next) => {
  const authenticated = req.isAuthenticated()
  const userID = authenticated ? req.session.passport.user : null
  const GhibliApi = new apiHandler()
  try {
    const dbMovie = await Movie.findOne({ api_id: req.params.id })
    const apiMovie = await GhibliApi.getFilmById(req.params.id)
    const { image } = dbMovie
    const { data } = apiMovie
    const movieRatings = await Rating.find({ movie: dbMovie.id }).populate({
      path: "user",
      select: "username",
    })

    const userRating = movieRatings.find(
      movieRating => movieRating.user.id === userID
    )
    res.render("pages/movie-details", {
      image,
      data,
      movieRatings,
      authenticated,
      userRating,
    })
  } catch (err) {
    next(err)
  }
})

router.post("/movie/:id/pending", checkLoggedIn, async (req, res, next) => {
  const userID = req.session.passport.user
  try {
    const movie = await Movie.findOne({ api_id: req.params.id })
    const user = await User.findById(userID).select("pendingMovies")
    if (!user.pendingMovies.includes(movie.id)) {
      const updatedUserMovies = [...user.pendingMovies, movie.id]
      User.findByIdAndUpdate(
        userID,
        { pendingMovies: updatedUserMovies },
        { omitUndefined: true }
      )
        .then(() => res.redirect("/profile"))
        .catch(err => next(err))
    } else {
      res.redirect("/profile")
    }
  } catch (err) {
    next(err)
  }
})

router.post("/movie/:id/watched", checkLoggedIn, async (req, res, next) => {
  const userID = req.session.passport.user

  try {
    const movie = await Movie.findOne({ api_id: req.params.id })
    const user = await User.findById(userID).select(
      "watchedMovies pendingMovies"
    )
    if (!user.watchedMovies.includes(movie.id)) {
      const updatedUserMovies = [...user.watchedMovies, movie.id]
      User.findByIdAndUpdate(
        userID,
        {
          watchedMovies: updatedUserMovies,
          pendingMovies: user.pendingMovies.filter(
            pendingMovie => pendingMovie != movie.id
          ),
        },
        { omitUndefined: true }
      )
        .then(() => res.redirect("/profile"))
        .catch(err => next(err))
    }
  } catch (err) {
    next(err)
  }
})

router.post("/movie/:id/review", checkLoggedIn, async (req, res, next) => {
  const userID = req.session.passport.user
  const rating = req.body.rating ? req.body.rating : undefined
  const comment = req.body.comment ? req.body.comment : undefined
  try {
    const movie = await Movie.findOne({ api_id: req.params.id })
    const userRating = await Rating.findOne({ user: userID, movie: movie.id })
    if (!userRating) {
      await Rating.create({
        user: userID,
        movie: movie.id,
        rating,
        comment,
      })
    } else {
      await Rating.findByIdAndUpdate(
        userRating.id,
        {
          rating,
          comment,
        },
        { omitUndefined: true }
      )
    }
    res.redirect(`/search/movie/${movie.api_id}`)
  } catch (err) {
    next(err)
  }
})

module.exports = router
