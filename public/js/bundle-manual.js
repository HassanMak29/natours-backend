/* eslint-disable */

// mapbox.js
const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaGFzc2FubWFrMjkiLCJhIjoiY2t4Z25yN3RmMms0dTMwbzE3MzVsZmg2cSJ9.Txb7-sbSByU7yu5Crownbw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/hassanmak29/ckxgo6rad4fxb14oexkpe9lxl',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 8,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //   Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //   Exrtend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 180,
      bottom: 100,
      left: 100,
      right: 100,
    },
  });
};

// alerts.js
const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
const showAlert = (type, msg) => {
  hideAlert();

  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

// login.js
const login = async (email, password) => {
  // console.log('LOGIN');
  // console.log(email, password);
  try {
    const result = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (result.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! Try again!');
  }
};

// Sign up
const register = async (name, email, password, passwordConfirm) => {
  try {
    const result = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (result.data.status === 'success') {
      showAlert('success', 'You signed up successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// updateSettings.js
const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${
        type === 'password' ? 'updateMyPassword' : 'updateMe'
      }`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successefully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// stripe.js
const bookTour = async (tourId, startDate, userId) => {
  const stripe = Stripe(
    'pk_test_51KDFGVHzIzfHChM880b4767h5adpghBKWSYXpvy8X1SWYr7ZFkGOCeRrSdlJU85bDNwjwmdFJlSLeFb9OvUc8niU00L0xKCXTl'
  );

  try {
    // 1)Get checkout session from API
    const session = await axios(
      `/api/v1/booking/checkout-session/${tourId}/${userId}/${startDate}`
    );
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.error(err);
    console.error(err.response.data);
    showAlert('error', err.response.data.message);
  }
};

// index.js
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const registerForm = document.querySelector('.form--register');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);

  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById(
      'register-passwordConfirm'
    ).value;

    register(name, email, password, passwordConfirm);
  });
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // console.log(form);

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;

    // updateSettings({ name, email }, 'data');
    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    // const tourId = e.target.dataset.tourId;
    const { tourId, startDate, userId } = e.target.dataset;
    bookTour(tourId, startDate, userId);
  });
}
