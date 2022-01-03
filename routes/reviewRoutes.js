const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });
const {
  getAllReviews,
  createReview,
  setTourUserIds,
} = require('../controllers/reviewController');

router.use(authController.protect);

router
  .route('/')
  .get(getAllReviews)
  .post(authController.restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
