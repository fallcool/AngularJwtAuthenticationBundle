Getting started
===============

Prerequisites
-------------

This bundle requires [LexikAuthenticationBundle](http://github.com/lexik/LexikJWTAuthenticationBundle/) (and the OpenSSL library if you intend to use the default provided encoder), [FOSUserBundle](http://github.com/FriendsOfSymfony/FOSUserBundle/) and the [FR3DLdapBundle
](http://github.com/Maks3w/FR3DLdapBundle) for LDAP support

**Protip:** Though the bundle doesn't enforce you to do so, it is highly recommended to use HTTPS. 

Installation
------------

Register the bundle and the dependencies bundles in `app/AppKernel.php`:

``` php
public function registerBundles()
{
    return array(
        // ...
        new Lexik\Bundle\JWTAuthenticationBundle\LexikJWTAuthenticationBundle(),
        new FOS\UserBundle\FOSUserBundle(),
        new FR3D\LdapBundle\FR3DLdapBundle(),
        new StephaneMangin\Bundle\AngularJwtAuthentication\StephaneManginAngularJwtAuthenticationBundle(),
        // ...
    );
}
```

Generate the SSH keys :

``` bash
$ openssl genrsa -out app/var/jwt/private.pem -aes256 4096
$ openssl rsa -pubout -in app/var/jwt/private.pem -out app/var/jwt/public.pem
```

Configuration
-------------

Configure the SSH keys path in your `config.yml` :

``` yaml
lexik_jwt_authentication:
    private_key_path: %kernel.root_dir%/var/jwt/private.pem   # ssh private key path
    public_key_path:  %kernel.root_dir%/var/jwt/public.pem    # ssh public key path
    pass_phrase:      ''                                      # ssh key pass phrase
    token_ttl:        86400                                   # token ttl - defaults to 86400
```

Configure the LDAP paths in your `config.yml` :

``` yaml
fr3d_ldap:
    driver:
        host:                     "%ldap_host%"
        port:                     "%ldap_port%"
        username:                 "%ldap_username%"
        password:                 "%ldap_password%"

    user:
        baseDn: "%ldap_basedn%"
        #filter: (&(objectClass=user))
        attributes:
            - { ldap_attr: samaccountname,  user_method: setUsername }
```

Configure the FOS User bundle paths in your `config.yml` :

``` yaml
fos_user:
    db_driver: orm # other valid values are 'mongodb', 'couchdb' and 'propel'
    firewall_name: main
    user_class: StephaneMangin\bundle\AngularJwtAuthentication\Entity\User
```

Confgure your `security.yml` :

``` yaml
security:
    encoders:
        Symfony\Component\Security\Core\User\User: plaintext
        FOS\UserBundle\Model\UserInterface: sha512
        StephaneMangin\bundle\AngularJwtAuthentication\Entity\User: plaintext

    role_hierarchy:
        ROLE_ADMIN:       ROLE_USER
        ROLE_SUPER_ADMIN: ROLE_ADMIN

    providers:
        chain_provider:
            chain:
                providers: [in_memory, fos_userbundle, fr3d_ldapbundle]
        fr3d_ldapbundle:
            id: fr3d_ldap.security.user.provider
        fos_userbundle:
            id: fos_user.user_manager
        in_memory:
            memory:
                users:
                    user: { password: user, roles: [ 'ROLE_USER' ] }
                    admin: { password: admin, roles: [ 'ROLE_ADMIN' ] }

    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false
        login:
            pattern:  ^/api/login
            stateless: true
            anonymous: true
            logout:    true
            form_login:
                check_path: /api/login_check
                require_previous_session: false
                username_parameter: username
                password_parameter: password
                success_handler: lexik_jwt_authentication.handler.authentication_success
                failure_handler: lexik_jwt_authentication.handler.authentication_failure
        api:
            pattern: ^/api
            stateless: true
            lexik_jwt:
                 authorization_header:
                     enabled: true
                     prefix: Bearer
                 query_parameter:
                     enabled: true
                     name: bearer
        default:
            anonymous: ~
        
    access_control:
        - { path: ^/login, role: IS_AUTHENTICATED_ANONYMOUSLY }
        - { path: ^/register, role: IS_AUTHENTICATED_ANONYMOUSLY }
        - { path: ^/resetting, role: IS_AUTHENTICATED_ANONYMOUSLY }
        - { path: ^/admin/, role: ROLE_ADMIN }
        - { path: ^/api/login, roles: IS_AUTHENTICATED_ANONYMOUSLY }
        - { path: ^/api, roles: ROLE_USER }
```

Confgure your `routing.yml` :

``` yaml
api_login_check:
    path: /api/login_check

fos_user_security:
    resource: "@FOSUserBundle/Resources/config/routing/security.xml"

fos_user_profile:
    resource: "@FOSUserBundle/Resources/config/routing/profile.xml"
    prefix: /profile

fos_user_register:
    resource: "@FOSUserBundle/Resources/config/routing/registration.xml"
    prefix: /register

fos_user_resetting:
    resource: "@FOSUserBundle/Resources/config/routing/resetting.xml"
    prefix: /resetting

fos_user_change_password:
    resource: "@FOSUserBundle/Resources/config/routing/change_password.xml"
    prefix: /profile
```

Add the dependencies to your `index.twig.html`. Assume that you have already imported angularJs, angularResource, AngularRoute and jQuery :

```html
    <!-...->
	<body ng-controller="AuthCtrl as auth">
    <!-...->
    
	<!-- Auth module -->
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/js/app.js')}}"></script>
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/js/controllers/authCtrl.js')}}"></script>
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/js/controllers/loginModalCtrl.js')}}"></script>
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/js/factory/auth-interceptor.js')}}"></script>
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/thirdparty/angular-local-storage/dist/angular-local-storage.js')}}"></script>
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/thirdparty/angular-http-auth/src/http-auth-interceptor.js')}}"></script>
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/thirdparty/angular-bootstrap/ui-bootstrap-tpls.js')}}"></script>
	<script type="text/javascript"
		src="{{asset('/bundles/stephanemanginangularjwtauthentication/thirdparty/angular-jwt/dist/angular-jwt.js')}}"></script>
    <!-...->
```

And dependencies to your main AngularJS module:

```javascript
	var my_app = angular
		.module('my app', [ 
			'authJwt'
		])
```

#### Important note for Apache users

As stated in [this link](http://stackoverflow.com/questions/11990388/request-headers-bag-is-missing-authorization-header-in-symfony-2) and [this one](http://stackoverflow.com/questions/19443718/symfony-2-3-getrequest-headers-not-showing-authorization-bearer-token/19445020), Apache server will strip any `Authorization header` not in a valid HTTP BASIC AUTH format. 

If you intend to use the authorization header mode of this bundle (and you should), please add those rules to your VirtualHost configuration :

```apache
RewriteEngine On
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]
```

Activate the rewrite mod

    $ a2enmod rewrite
    
Allow apache overridings with .htaccess in your VirtualHost

    # AllowOverride All

Check system dependencies
-------------------------

    $ php app/check.php
    
Usage
-----

### 1. Obtain the token

The first step is to authenticate the user using its credentials.
A classical form_login on an anonymously accessible firewall will do perfect.

Just set the provided `lexik_jwt_authentication.handler.authentication_success` service as success handler to
generate the token and send it as part of a json response body.

Store it (client side), the JWT is reusable until its ttl has expired (86400 seconds by default).

### 2. Use the token

Simply pass the JWT on each request to the protected firewall, either as an authorization header
or as a query parameter. 

By default only the authorization header mode is enabled : `Authorization: Bearer {token}`

#### Examples

For lexik bundle :

    * See [Functionally testing a JWT protected api](3-functional-testing.md) document
    * or the [sandbox application](https://github.com/slashfan/LexikJWTAuthenticationBundleSandbox) for a fully working example.

##### With Curl

###### Get the token

    $ curl -X POST -d '{"username": "user", "password": "user"}' -H "Content-Type:application/json" http://localhost/app_dev.php/api/login_check

Returns : 

```json
{
  "token":"eyJhbGciOiJS(...)TYr9RpH0",
  "data":{
    "username":"user",
    "roles":[
      "ROLE_USER"
    ]
  }
}
```
###### Keep token safe
	
    $ curl -X POST -d '{"username": "admin", "password": "admin"}' -H "Content-Type:application/json" http://localhost/app_dev.php/api/login_check | cut -c 11-827 > token.txt

###### Get a resource

    $ curl -Lv -X GET -H "Accept:application/json" -H "Authorization: Bearer $(cat token.txt)" 'my resource URI'

Notes from lexik bundle
-----------------------

#### About token expiration

Each request after token expiration will result in a 401 response.
Redo the authentication process to obtain a new token.

#### Working with CORS requests

This is more of a Symfony2 related topic, but see [Working with CORS requests](4-cors-requests.md) document
to get a quick explanation on handling CORS requests.

#### A stateless form_login replacement

Using form_login security factory is very straightforward but it involves cookies exchange, even if the stateless parameter is set to true.

This may not be a problem depending on the system that makes calls to your API (like a typical SPA). But if it is, take a look at the [GfreeauGetJWTBundle](https://github.com/gfreeau/GfreeauGetJWTBundle), which provides a stateless replacement for form_login.

Further documentation
---------------------

The following documents are available for lexik bundle:

- [Configuration reference](https://github.com/lexik/LexikJWTAuthenticationBundle/blob/master/Resources/doc/1-configuration-reference.md)
- [Data customization and validation](https://github.com/lexik/LexikJWTAuthenticationBundle/blob/master/Resources/doc/2-data-customization.md)
- [Functionally testing a JWT protected api](https://github.com/lexik/LexikJWTAuthenticationBundle/blob/master/Resources/doc/3-functional-testing.md)
- [Working with CORS requests](https://github.com/lexik/LexikJWTAuthenticationBundle/blob/master/Resources/doc/4-cors-requests.md)
- [JWT encoder service customization](https://github.com/lexik/LexikJWTAuthenticationBundle/blob/master/Resources/doc/5-encoder-service.md)
