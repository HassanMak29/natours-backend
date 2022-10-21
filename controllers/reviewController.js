const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

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

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.createReview = factory.createOne(Review);
