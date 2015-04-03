(function() {

    'use strict';

    angular.module('authJwt')
        .controller('LoginModalCtrl', function ($scope, $modalInstance, AuthenticationService) {

            $scope.credentials = {
                username: $scope.username,
                password: $scope.password
            };

            $scope.$on('event:auth-login-failed', function () {
                $scope.errorMessage = 'Identification incorrecte';
            });

            $scope.$on('event:auth-login-complete', function () {
                $modalInstance.close();
            });

            $scope.submit = function (credentials) {
                AuthenticationService.login(credentials);
                console.log($scope);
            };

        });
})();