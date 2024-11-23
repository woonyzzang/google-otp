const express = require('express');
// const app = express();
const router = express.Router();
// const bodyParser = require('body-parser');
const session = require('express-session');

/** Setup Step 1:  Install NPM Module */
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

let sess = {
  secret: "@#@$MYSIGN#@$#$",
  resave: false,
  saveUninitialized: true
  // cookie: {secure: true}
};

router.use(session(sess));
router.use(express.json());
// router.use(bodyParser.urlencoded({extended: false}));
// router.use(bodyParser.json());

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

router.get('/qr', (req, res) => {
  console.log('######## /rq ######## ');

  /** Setup Step 2:  Generate a Secret Key */
  // 1. generateSecret를 사용하여 otp secret key값을 구해야 한다.
  const secret = speakeasy.generateSecret({
    length: 20, // OTP Key값의 string length
    name: 'sw.cho',
    issuer: 'test@test.com',
    algorithm: 'sha512'
  });
  // [E] OUTPUT:
  // base32 값을 user database에 저장해둬야 함. 추후 qrcode의 number와 verify할때 사용할 값.
  // {
  //   ascii: 'c}d8Z?.o(}',
  //   hex: '637d64385a3f2e6f287d',
  //   base32: 'MN6WIOC2H4XG6KD5',
  //   otpauth_url: 'otpauth://totp/test%40test.com?secret=MN6WIOC2H4XG6KD5'
  // }

  sess = req.session;
  sess.secret = secret;

  // 2. Google OTP와 호환되는 otpauth : // URL을 생성
  const url = speakeasy.otpauthURL({
    secret: secret.ascii, // generateSecret에서 구한 ascii값을 넣어줘야함.
    issuer: 'OTP TEST',
    label: 'sw.cho@zempot.com',
    algorithm: 'sha512',
    period: 300 // OTP에서 digit의 갱신 주기를 set, ( 기본값을 30sec ).
  });

  /** Setup Step 3:  Get Qrcode. */
  // 1. qrcode module을 사용해서 step2에서 받은 otpurl을 넣어주면 base64로 인코딩된 qrcode를 얻을 수 있음.
  // imageData 는 html 에서 img 태그에 넣어주면 qa 코드를 띄어줄 수 있다. 서비스단에서 사용자에게 시크릿 키를 qr 로 넘겨줄 때 img 태그로 띄워주면 된다.
  // url 은 imageData 와 비슷한데 다음 링크에서 qrcode 로 변환할 수 있다. (https://ko.qr-code-generator.com/)
  qrcode.toDataURL(url, async (err, imageData) => {
    console.log('img data: ', imageData);
    console.log('url: ', url);
    console.log('secret.base32: ', secret.base32);

    res.json({
      img: imageData
    });
  });
  // 2. 아래와 같은 OUTPUT을 얻울 수 있는데 여기서 base64, 뒤에 있는 부분부터 qrcode data임.
  // [E] OUTPUT:
  // otpauth://totp/clrch4n@gamil.com?
  // secret=MN6WIOC2H4XG6KD5&issuer=TEST&algorithm=SHA512&period=10
  // data:image/png;base64,iVBORw0..........9rreNhrXU8rLWOh7XW8bDWOh7WWsfDWut4WGsd/wPx78GrDKx/NwAAAABJRU5ErkJggg==

  // 3. 간단하게 웹에서 해당 qrcode를 확인하려면, https://www.base64decode.net/base64-image-decoder 여기서 확인 할 수 있음.
});

router.post('/auth', (req, res) => {
  console.log('######## /auth ######## ');

  sess = req.session;

  console.log('sess:: ', sess);
  console.log('req.body.token:: ', req.body.token);

  /** User Step 1:  Scan the QR Code / Add Site to Authenticator */
  // 1. return 된 값이 True이면 verify, False 이면 not verify.
  // - secret에 generateSecret에서 저장했던 값을 넣어 줘야함.
  // - token에 otp App에 나온 값을 넣어 줘야 함.
  const verified = speakeasy.totp.verify({
    secret: sess.secret.base32,
    encoding: 'base32',
    token: req.body.token
  });

  res.json({
    loggedIn: verified
  });
});

module.exports = router;
