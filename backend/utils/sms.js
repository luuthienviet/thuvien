/**
 * Gửi SMS OTP qua eSMS.vn
 * Đăng ký tại: https://esms.vn
 * Tài liệu API: https://esms.vn/tai-lieu-esms-api
 */
const sendOtpSms = async (phone, otp) => {
  const apiKey    = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;

  // Nếu chưa cấu hình eSMS → fallback log ra console (dùng khi test)
  const isConfigured =
    apiKey &&
    secretKey &&
    apiKey !== 'your_esms_api_key_here' &&
    secretKey !== 'your_esms_secret_key_here';

  if (!isConfigured) {
    console.log('');
    console.log('══════════════════════════════════════════════');
    console.log(`📱  [OTP – CHƯA CÀI eSMS]`);
    console.log(`    Số điện thoại : ${phone}`);
    console.log(`    Mã OTP        : ${otp}`);
    console.log(`    Hiệu lực      : 5 phút`);
    console.log('══════════════════════════════════════════════');
    console.log('');
    // Trả về thành công (không gửi SMS thật)
    return { CodeResult: '100', note: 'fallback-console' };
  }

  // Chuẩn hóa số điện thoại về dạng 84xxxxxxxxx
  const normalizedPhone = phone.replace(/^0/, '84');

  const content = `Ma OTP dat lai mat khau cua ban la: ${otp}. Hieu luc 5 phut. Khong chia se ma nay cho ai.`;

  const body = JSON.stringify({
    ApiKey:    apiKey,
    Content:   content,
    Phone:     normalizedPhone,
    SecretKey: secretKey,
    SmsType:   2,  // 2 = OTP / chăm sóc khách hàng
    Sandbox:   process.env.ESMS_SANDBOX === 'true' ? 1 : 0,
  });

  const res = await fetch(
    'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  );

  if (!res.ok) {
    throw new Error(`eSMS HTTP error: ${res.status}`);
  }

  const data = await res.json();

  // CodeResult = 100 là thành công
  if (data.CodeResult !== '100') {
    throw new Error(`eSMS lỗi ${data.CodeResult}: ${data.ErrorMessage || 'Không rõ lỗi'}`);
  }

  console.log(`✅ [SMS] OTP đã gửi đến ${phone} — SMSID: ${data.SMSID}`);
  return data;
};

module.exports = { sendOtpSms };
