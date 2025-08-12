
// 錯誤訊息翻譯
const translateError = (error: string) => {
  if (error.includes("invalid email")) return "電子郵件格式不正確";
  if (error.includes("email already in use")) return "該電子郵件已被註冊";
  if (error.includes("weak password"))
    return "密碼強度不足，請使用更複雜的密碼";
  if (error.includes("invalid login credentials")) return "電子郵件或密碼錯誤";
  return error;
};

export default translateError;