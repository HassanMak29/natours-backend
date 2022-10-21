const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/checkout-session/:tourId/:userId/:startDate',
  bookingController.checkTourAvailability,
  bookingController.getCheckoutSession
);

router.route('/').post(bookingController.createBooking);

router.use(authController.restrictTo('admin', 'lead-guide'));

router.route('/').get(bookingController.getAllBookings);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
