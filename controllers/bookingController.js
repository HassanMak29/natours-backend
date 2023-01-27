const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const { startDate } = req.params;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    // cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    success_url: `${process.env.FRONT_URL}/user/bookings`,
    cancel_url: `${process.env.FRONT_URL}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    metadata: {
      startDate: startDate,
    },
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
        },
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.checkTourAvailability = catchAsync(async (req, res, next) => {
  const { tourId, userId, startDate } = req.params;

  const tour = await Tour.findById(tourId);

  const { participants, soldOut } = tour.startDates.find(
    (startDateObj) =>
      startDateObj.date.toISOString() === new Date(+startDate).toISOString()
  );

  if (participants.includes(userId))
    return next(new AppError('This user has already booked this tour', 403));
  if (soldOut)
    return next(
      new AppError('This tour is sold out, please try another date', 400)
    );

  next();
});

const createBookingCheckout = async (session) => {
  const tourId = session.client_reference_id;
  const userId = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  const startDate = new Date(
    parseInt(session.metadata.startDate, 10)
  ).toISOString();

  await Booking.create({ tour: tourId, user: userId, price, startDate });

  const tour = await Tour.findById(tourId);

  const { maxGroupSize } = tour;
  const { participants } = tour.startDates.find(
    (startDateObj) => startDateObj.date.toISOString() === startDate
  );

  if (maxGroupSize - participants.length > 1) {
    participants.push(userId);
  } else if (maxGroupSize - participants.length === 1) {
    participants.push(userId);
    tour.startDates.find(
      (obj) => obj.date.toISOString() === startDate
    ).soldOut = true;
  }

  tour.save();
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) {
    return next(new AppError(`No booking found with this ID`, 404));
  }
  const tour = await Tour.findById(booking.tour.id);

  const { participants } = tour.startDates.find((startDateObj) =>
    startDateObj.participants.includes(req.user._id)
  ) || { participants: [] };

  if (participants.length > 0) {
    const index = participants.indexOf(req.user._id.toString());
    participants.splice(index, 1);

    await tour.save();
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
