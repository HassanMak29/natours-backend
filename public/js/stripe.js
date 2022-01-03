/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51KDFGVHzIzfHChM880b4767h5adpghBKWSYXpvy8X1SWYr7ZFkGOCeRrSdlJU85bDNwjwmdFJlSLeFb9OvUc8niU00L0xKCXTl'
  );
  try {
    // 1)Get checkout session from API
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + charge credit cart
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
