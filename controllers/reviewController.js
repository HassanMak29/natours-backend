const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user._id });

  if (!reviews) return next(new AppError('You do not have any reviews.', 404));

  res.status(200).json({
    status: 'success',
    data: reviews,
  });
});

exports.restrictToBooker = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({
    tour: req.body.tour,
    user: req.body.user,
  });
  const { startDates } = await Tour.findById(req.body.tour);
  const currentDate = new Date();

  if (!booking)
    return next(
      new AppError(
        'You cannot review this tour. This tour was not booked by this user',
        404
      )
    );
  if (currentDate < startDates[0]) {
    return next(
      new AppError('You cannot review a tour before its start date', 406)
    );
  }
  next();
});

exports.restrictToReviwerOrAdmin = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const reviews = await Review.find({ user: req.user._id });
  const isItOwnReview =
    reviews &&
    reviews.find((review) => String(review._id) === String(req.params.id));

  if (!isItOwnReview && user.role !== 'admin')
    return next(
      new AppError(
        'You cannot edit this review. This review was not added by this user',
        404
      )
    );

  next();
});

exports.isItAlreadyReviewed = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({
    tour: req.body.tour,
    user: req.body.user,
  });

  if (review)
    return next(new AppError('You have already reviewed this tour!', 400));
  next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.createReview = factory.createOne(Review);
