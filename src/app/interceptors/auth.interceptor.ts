import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const currentUserStr = localStorage.getItem('currentUser');

  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser?.token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        return next(authReq);
      }
    } catch (e) {
      console.error('Error parsing currentUser from localStorage', e);}
  }

  return next(req);
};