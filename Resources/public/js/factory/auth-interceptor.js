(function() {

    'use strict';

    // HTTP Auth Interceptor
    angular.module('authJwt')
        .factory('AuthenticationService', function ($rootScope, $http, authService, $httpBackend, localStorageService) {
            return {
                login: function (credentials) {
                    $http
                        .post('api/login_check', credentials, {ignoreAuthModule: false})
                        .success(function (data, status, headers, config) {
                            $http.defaults.headers.common.Authorization = 'Bearer ' + data.token;  // Step 1
                            authService.loginConfirmed(data, function (config) {  // Step 2 & 3
                                config.headers.Authorization = 'Bearer ' + data.token;
                                localStorageService.set('token', data.token);
                                $rootScope.$broadcast('event:auth-login-complete');
                                return config;
                            });
                        })
                        .error(function (data, status, headers, config) {
                            $rootScope.$broadcast('event:auth-login-failed', status);
                        });
                },
                logout: function () {
                    delete $http.defaults.headers.common.Authorization;
                    console.log('delete');
                    localStorageService.clearAll();
                    $rootScope.$broadcast('event:auth-logout-complete');
                }
            };
        });
})();