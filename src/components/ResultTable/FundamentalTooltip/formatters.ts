// 格式化工具函數

export const formatValue = (
  value: any | [any, any],
  suffix: string = "",
  decimals: number = 2
): string => {
  if (Array.isArray(value)) {
    const [first, second] = value;
    const formattedFirst =
      first === null || first === undefined || first === "" || isNaN(first)
        ? "N/A"
        : Number(first).toFixed(decimals);
    const formattedSecond =
      second === null ||
      second === undefined ||
      second === "" ||
      isNaN(second)
        ? "N/A"
        : Number(second).toFixed(decimals);
    return `${formattedFirst}${suffix} / ${formattedSecond}${suffix}`;
  }

  if (value === null || value === undefined || value === "" || isNaN(value)) {
    return "N/A";
  }
  const numValue = Number(value);
  return `${numValue.toFixed(decimals)}${suffix}`;
};

export const isValidNumber = (value: any): boolean => {
  return !(value === null || value === undefined || value === "" || isNaN(value));
};

export const getValueColor = (
  value: any | [any, any] | [any, any, any], 
  colorRule: 'positive_green' | 'negative_red' | 'both_red_when_negative' = 'positive_green'
): string => {
  // 處理陣列情況（如營收的 mom/yoy 或 mom/yoy/累計yoy）
  if (Array.isArray(value)) {
    const validValues = value.filter(v => isValidNumber(v)).map(v => Number(v));
    
    // 如果沒有有效值，返回預設顏色
    if (validValues.length === 0) {
      return "text.secondary";
    }
    
    // 對於營收數據，只要有一個值小於0就顯示紅色
    if (colorRule === 'both_red_when_negative') {
      if (validValues.some(v => v < 0)) {
        return "error.main";
      }
      return "success.main";
    }
    
    // 其他情況使用第一個有效值來判斷顏色
    return getSingleValueColor(validValues[0], colorRule);
  }

  return getSingleValueColor(value, colorRule);
};

const getSingleValueColor = (
  value: any,
  colorRule: 'positive_green' | 'negative_red' | 'both_red_when_negative'
): string => {
  if (!isValidNumber(value)) {
    return "text.secondary";
  }
  
  const numValue = Number(value);
  
  switch (colorRule) {
    case 'positive_green':
      // 正數綠色，負數紅色，零黑色
      if (numValue > 0) return "success.main";
      if (numValue < 0) return "error.main";
      return "text.primary";
      
    case 'negative_red':
      // 負數紅色，正數和零都是黑色
      if (numValue < 0) return "error.main";
      return "text.primary";
      
    case 'both_red_when_negative':
      // 小於0紅色，其他綠色
      if (numValue < 0) return "error.main";
      return "success.main";
      
    default:
      return "text.primary";
  }
};