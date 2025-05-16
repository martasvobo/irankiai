import * as admin from "firebase-admin";

admin.initializeApp();

import movieController from "./controllers/movieController";
export const getMovies = movieController.getMovies;
export const createMovie = movieController.createMovie;
export const updateMovie = movieController.updateMovie;
export const deleteMovie = movieController.deleteMovie;

import userController from "./controllers/userController";
export const getUsers = userController.getUsers;
export const createUser = userController.createUser;
export const updateUser = userController.updateUser;
export const deleteUser = userController.deleteUser;

import cinemaController from "./controllers/cinemaController";
export const getCinemas = cinemaController.getCinemas;
export const createCinema = cinemaController.createCinema;
export const updateCinema = cinemaController.updateCinema;
export const deleteCinema = cinemaController.deleteCinema;

import movieScreeningController from "./controllers/movieScreeningController";
export const getMovieScreenings = movieScreeningController.getMovieScreenings;
export const createMovieScreening = movieScreeningController.createMovieScreening;
export const updateMovieScreening = movieScreeningController.updateMovieScreening;
export const deleteMovieScreening = movieScreeningController.deleteMovieScreening;

import personalMovieController from "./controllers/personalMovieController";
export const getPersonalMovies = personalMovieController.getPersonalMovies;
export const createPersonalMovie = personalMovieController.createPersonalMovie;
export const updatePersonalMovie = personalMovieController.updatePersonalMovie;
export const deletePersonalMovie = personalMovieController.deletePersonalMovie;
