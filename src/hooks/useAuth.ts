// src/hooks/useAuth.ts
const mockLogin = (values: any) => 
    new Promise(resolve => {
      setTimeout(() => {
        resolve({ 
          data: { 
            token: 'mock-token',
            user: { name: 'Test User' }
          }
        });
      }, 1000);
    });
  
  export function useAuth() {
    const login = async (values: any) => {
      const response: any = await mockLogin(values);
      localStorage.setItem('token', response.data.token);
    };
    
    return { login };
  }