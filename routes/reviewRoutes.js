const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
const {
  getReview,
  updateReview,
  deleteReview,
  getAllReviews,
  createReview,
  setTourUserIds,
  restrictToBooker,
  restrictToReviwerOrAdmin,
  isItAlreadyReviewed,
  getAllMyReviews,
} = require('../controllers/reviewController');

router.use(authController.protect);

router.route('/:userId').get(getAllMyReviews);

router
  .route('/')
  .get(getAllReviews)
  .post(
    authController.restrictTo('user'),
    setTourUserIds,
    restrictToBooker,
    isItAlreadyReviewed,
    createReview
  );

router
  .route('/:id')
  .get(getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    restrictToReviwerOrAdmin,
    updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    restrictToReviwerOrAdmin,
    deleteReview
  );

module.exports = router;
