'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { respond, respondOrRedirect } = require('../utils');
const Quiz = mongoose.model('Quiz');
const assign = Object.assign;

/**
 * Load
 */

exports.load = async(function* (req, res, next, id) {
  try {
    req.quiz = yield Quiz.load(id);
    if (!req.quiz) return next(new Error('Quiz not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.index = async(function* (req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const _id = req.query.item;
  const limit = 30;
  const options = {
    limit: limit,
    page: page
  };

  if (_id) options.criteria = { _id };

  const quizzes = yield Quiz.list(options);
  const count = yield Quiz.count();

  respond(res, 'quizzes/index', {
    title: 'Quizzes',
    quizzes: quizzes,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * New quiz
 */

exports.new = function (req, res){
  res.render('quizzes/new', {
    title: 'New Quiz',
    quiz: new Quiz()
  });
};

/**
 * Create an quiz
 * Upload an image
 */

exports.create = async(function* (req, res) {
  const quiz = new Quiz(only(req.body, 'title'));
  quiz.user = req.user;
  try {
    yield quiz.uploadAndSave(req.file);
    respondOrRedirect({ req, res }, `/quizzes/${quiz._id}`, quiz, {
      type: 'success',
      text: 'Successfully created quiz!'
    });
  } catch (err) {
    respond(res, 'quizzes/new', {
      title: quiz.title || 'New Quiz',
      errors: [err.toString()],
      quiz
    }, 422);
  }
});

/**
 * Edit an quiz
 */

exports.edit = function (req, res) {
  res.render('quizzes/edit', {
    title: 'Edit ' + req.quiz.title,
    quiz: req.quiz
  });
};

/**
 * Update quiz
 */

exports.update = async(function* (req, res){
  const quiz = req.quiz;
  assign(quiz, only(req.body, 'title'));
  try {
    yield quiz.uploadAndSave(req.file);
    respondOrRedirect({ res }, `/quizzes/${quiz._id}`, quiz);
  } catch (err) {
    respond(res, 'quizzes/edit', {
      title: 'Edit ' + quiz.title,
      errors: [err.toString()],
      quiz
    }, 422);
  }
});

/**
 * Show
 */

exports.show = function (req, res){
  respond(res, 'quizzes/show', {
    title: req.quiz.title,
    quiz: req.quiz
  });
};

/**
 * Delete an quiz
 */

exports.destroy = async(function* (req, res) {
  yield req.quiz.remove();
  respondOrRedirect({ req, res }, '/quizzes', {}, {
    type: 'info',
    text: 'Deleted successfully'
  });
});
