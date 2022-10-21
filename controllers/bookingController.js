const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  const { startDates } = tour;

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}&startDate=${new Date(
    //   tour.startDates[0].date
    // ).getTime()}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    metadata: {
      startDate: startDates[0].date,
    },
    mode: 'payment',
    // line_items: [
    //   {
    //     name: `${tour.name} Tour`,
    //     description: tour.summery,
    //     images: [
    //       `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
    //     ],
    //     amount: tour.price * 100,
    //     currency: 'usd',
    //     quantity: 1,
    //   },
    // ],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summery,
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
  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// {
//   name: `${tour.name} Tour`,
//   description: tour.summery,
//   images: [
//     `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
//   ],
//   amount: tour.price * 100,
//   currency: 'usd',
//   quantity: 1,
// },

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // this is only temporary because it is unsecure everyone can make bookings without paying
//   const { tour, user, price, startDate } = req.query;

//   if (!tour && !user && !price && !startDate) return next();

//   const startDateString = new Date(+startDate).toISOString();

//   await Booking.create({ tour, user, price, startDate: startDateString });

//   await Tour.findById(tour, (e, data) => {
//     if (e) console.log(e);

//     const { maxGroupSize } = data;
//     const { participants } = data.startDates.find(
//       (obj) => obj.date.toISOString() === startDateString
//     );

//     if (maxGroupSize - participants.length > 1) {
//       participants.push(user);
//     } else if (maxGroupSize - participants.length === 1) {
//       participants.push(user);
//       data.startDates.find(
//         (obj) => obj.date.toISOString() === startDateString
//       ).soldOut = true;
//     }

//     data.save();
//   });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

exports.checkTourAvailability = catchAsync(async (req, res, next) => {
  const { tourId, userId, startDate } = req.params;

  await Tour.findById(tourId, (e, data) => {
    if (e) console.log('checkTourAvailability event: ', e);

    const { participants, soldOut } = data.startDates.find(
      (obj) => obj.date.toISOString() === new Date(+startDate).toISOString()
    );

    if (participants.includes(userId))
      return next(new AppError('This user already booked this tour', 403));
    if (soldOut)
      return next(
        new AppError('This tour is sold out, please try another date', 400)
      );

    next();
  });
});

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  const startDate = new Date(session.metadata.startDate * 1000).toISOString();
  await Booking.create({ tour, user, price, startDate });

  await Tour.findById(tour, (e, data) => {
    if (e) console.log('checkTourAvailability event: ', e);

    const { maxGroupSize } = data;
    const { participants } = data.startDates.find(
      (obj) => obj.date.toISOString() === startDate
    );

    if (maxGroupSize - participants.length > 1) {
      participants.push(user);
    } else if (maxGroupSize - participants.length === 1) {
      participants.push(user);
      data.startDates.find(
        (obj) => obj.date.toISOString() === startDate
      ).soldOut = true;
    }

    data.save();
  });
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

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
