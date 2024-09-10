// LoginScreenUtils.ts

export const getRandomName = () => {
    const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie'];
    const lastNames = ['Doe', 'Smith', 'Brown', 'Johnson', 'Lee'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  };
  
  export const getRandomAddress = () => {
    const streets = ['Main St', 'High St', 'Elm St', 'Maple Ave', 'Oak St'];
    const streetNumber = Math.floor(Math.random() * 1000) + 1;
    return `${streetNumber} ${streets[Math.floor(Math.random() * streets.length)]}`;
  };
  
  export const getRandomDob = () => {
    const year = Math.floor(Math.random() * 30) + 1970;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };
  
  export const getRandomPhone = () => {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const centralOfficeCode = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${areaCode}-${centralOfficeCode}-${lineNumber}`;
  };
  
  export const getRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  