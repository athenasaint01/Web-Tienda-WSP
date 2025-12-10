const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('\nPassword:', password);
  console.log('Hash generado:', hash);
  console.log('\nSQL para actualizar:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@alahas.com';`);
});
