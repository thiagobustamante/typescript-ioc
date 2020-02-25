[![npm version](https://badge.fury.io/js/typescript-ioc.svg)](https://badge.fury.io/js/typescript-ioc)
[![Build Status](https://travis-ci.org/thiagobustamante/typescript-ioc.png?branch=master)](https://travis-ci.org/thiagobustamante/typescript-ioc)
[![Coverage Status](https://codecov.io/gh/thiagobustamante/typescript-ioc/branch/master/graph/badge.svg)](https://codecov.io/gh/thiagobustamante/typescript-ioc)
[![Known Vulnerabilities](https://snyk.io/test/github/thiagobustamante/typescript-ioc/badge.svg?targetFile=package.json)](https://snyk.io/test/github/thiagobustamante/typescript-ioc?targetFile=package.json)

# IoC Container for Typescript
This is a lightweight annotation-based dependency injection container for typescript.

It can be used on browser, on react native or on node.js server code.

The documentation for the previous version can be found here: https://github.com/thiagobustamante/typescript-ioc/wiki/Typescript-IoC-1.x


**Table of Contents** 

- [IoC Container for Typescript](#)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Basic Usage](#basic-usage)
  - [@Scoped](#scopes)
  - [@Provider](#providers)
  - [@Provides](#providing-implementation-for-base-classes)
  - [@OnlyContainerCanInstantiate](#the-onlycontainercaninstantiate-annotation)
  - [@The Container Class](#the-container-class)
    - [Registering from multiple files](#registering-from-multiple-files)
    - [Importing configurations from external file](#importing-configurations-from-external-file)
  - [A note about classes and interfaces](#a-note-about-classes-and-interfaces)
  - [Browser usage](#browser-usage)
  - [Best practices](#best-practices)
  - [Restrictions](#restrictions)

## Installation

This library only works with typescript. Ensure it is installed:

```bash
npm install typescript -g
```

To install typescript-ioc:

```bash
npm install typescript-ioc
```

## Configuration

Typescript-ioc requires the following TypeScript compilation options in your tsconfig.json file:

```typescript
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Basic Usage

```typescript
import {Inject} from "typescript-ioc";

class PersonDAO {
  @Inject
  restProxy: PersonRestProxy;
}
```

That's it. You can just call now:

```typescript
let personDAO: PersonDAO = new PersonDAO();
```

And the dependencies will be resolved.

You can also inject constructor parameters, like:

```typescript
class PersonService {
  private personDAO: PersonDAO;
  constructor( @Inject personDAO: PersonDAO ) {
    this.personDAO = personDAO;
  }
}
```

and then, if you make an injection to this class, like...

```typescript
class PersonController {
  @Inject
  private personService: PersonService;
}
```

The container will create an instance of PersonService that receives the PersonDAO from the container on its constructor.
But you can still call:

```typescript
let personService: PersonService = new PersonService(myPersonDAO);
```

And pass your own instance of PersonDAO to PersonService.

Note that any type with a constructor can be injected.

```typescript
class PersonController {
  @Inject
  private personService: PersonService;

  @Inject
  creationTime: Date;
}
```

### Inheritance

You don't have to do anything special to work with sub-types.

```typescript
abstract class BaseDAO {
  @Inject
  creationTime: Date;
}

class PersonDAO extends BaseDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

class ProgrammerDAO extends PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;
}
```

The above example will work as expected.

## Scopes

You can use scopes to manage your instances as:

```typescript
@Singleton 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}

class PersonController {
  @Inject
  private personService: PersonService;

  @Inject
  creationTime: Date;
}
```

So, we can create a lot of PersonController instances, but all of them will share the same singleton instance of PersonService

```typescript
let controller1: PersonController = new PersonController();
let controller2: PersonController = new PersonController();

```

We have two pre defined scopes (Scope.Singleton and Scope.Local), but you can define your own custom Scope. You just have to extend the Scope abstract class:

```typescript
class MyScope extends Scope { 
  resolve(iocProvider:Provider, source:Function) {
    console.log('created by my custom scope.')
    return iocProvider.get();
  }
}
@Scoped(new MyScope()) 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}
```

## Providers

Providers can be used as a factory for instances created by the IoC Container.

```typescript
const personProvider: Provider = { 
  get: () => { return new PersonService(); }
};
@Scoped(new MyScope()) 
@Provided(personProvider)
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}
```

## Providing implementation for base classes
It is possible to tell the container to use one class as the implementation for a super class. 

```typescript
class PersonDAO extends BaseDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

@Provides (PersonDAO)
class ProgrammerDAO extends PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;
}
```

So, everywhere you inject a PersonDAO will receive a ProgrammerDAO instance instead. However, is still possible to create PersonDAO instances through its constructor, like:

```typescript
// a personDAO instance will be returned, 
// with its dependecies resolved by container
let personDAO: PersonDAO = new PersonDAO(); 
```

## The @OnlyContainerCanInstantiate annotation
The @OnlyContainerCanInstantiate annotation transforms the annotated class, changing its constructor. So, it will only be able to create new instances for the decorated class through to the IoC Container.

It is usefull, for example, to avoid direct instantiation of Singletons.

```typescript
@Singleton 
@OnlyContainerCanInstantiate 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}
```

If anybody try to invoke: 
```typescript
new PersonService();
```

Will raise a TypeError. 

## The Container class

You can also bind types directly to Container resolution.

```typescript
// it will override any annotation configuration
Container.bind(PersonDAO).to(ProgrammerDAO).scope(Scope.Local); 

// that will make any injection to Date to return 
// the same instance, created when the first call is executed.
Container.bind(Date).to(Date).scope(Scope.Singleton); 

// it will ask the IoC Container to retrieve the instance.
let personDAO = Container.get(PersonDAO); 
```

```typescript
class PersonDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

Container.bind(PersonDAO); 
let personDAO: PersonDAO = Container.get(PersonDAO); 
// or
let otherPersonDAO: PersonDAO = new PersonDAO(); 
// personDAO.personRestProxy is defined. It was resolved by Container.
```

```typescript
@OnlyContainerCanInstantiate
@Singleton
class PersonDAO {
}

let p: PersonDAO = new PersonDAO(); // throws a TypeError.  classes decorated with @OnlyContainerCanInstantiate can not be instantiated directly

const personProvider: Provider = { 
  get: () => { return new PersonDAO(); }
};
Container.bind(PersonDAO).provider(personProvider); //Works OK

let personDAO = Container.get(PersonDAO); // Works OK
```

You can use snapshot and restore for testing or where you need to temporarily override a binding.
```typescript
describe('Test Service with Mocks', () => {

    before(function () {
        // Hack for lazy loading (mentioned elsewhere in docs)
        MyIoCConfigurations.configure();

        // Store the IoC configuration for IService
        Container.snapshot(IService);
        
        // Change the IoC configuration to a mock service.
        Container.bind(IService).to(MockService);
    });

    after(function () {
        // Put the IoC configuration back for IService, so other tests can run.
        Container.restore(IService);
    });

    it('Should do a test', () => {
        // Do some test
    });
});
```
### Registering from multiple files

Typescript-ioc does not scan any folder looking for classes to be registered into the Container. Your classes must be previously imported.

So, when you import a file, the decorators around the classes are activated and your decorated classes are registered into the IoC Container. However, if you have some types that are not explicitly imported by your code, you need to tell the IoC Container that they must be included.

For example, suppose:

```typescript
abstract class PersonDAO {
  abstract save(person: Person);
}

@Provides (PersonDAO)
class PersonDAOImpl implements PersonDAO {
  // ...
}
```

If PersonDAOImpl is saved in a file that is not explicitly imported by your code, you will need to manually add it to the Container.

You can do this through ```Container.bind()```, as previously showed, or you can use the ```ContainerConfig``` class to configure the sources to be included:

```typescript
import { ContainerConfig } from "typescript-ioc/container-config";

ContainerConfig.addSource('lib/*'); // You can use glob patterns here
// or
ContainerConfig.addSource('controllers/*', 'baseFolder');
// or 
ContainerConfig.addSource(['**/*', '!foo.js'], 'baseFolder');
```

You need to configure those sources only once, but before you try to use the objects that depends on these files. This configuration only makes sense in NodeJS code. In browser, all your script will be already packaged and included into the page and you will never need to worry about it. Browserify or webpack will do the job for you.

### Importing configurations from external file

You can also put all manual container configurations in an external file and the use the '''ContainerConfig''' class to import them.

For example, you can create the ```ioc.config.ts``` file:

```typescript
import { MyType, MyTypeImpl, MyType2, MyType2Provider } from './my-types';
import { Scope } from 'typescript-ioc';

export default [
  { bind: MyType, to: MyTypeImpl },
  { 
    bind: MyType2, 
    provider: MyType2Provider, 
    withParams: ['param1'], 
    scope: Scope.Singleton 
  }
];

```

And then import the configurations using:

```typescript
import { ContainerConfig } from "typescript-ioc/container-config";
import config from './ioc.config';

ContainerConfig.configure(config);
```

You need to load the configurations only once, but before you try to use the objects that depends on these files.


## A note about classes and interfaces

Typescript interfaces only exist at development time, to ensure type checking. When compiled, they do not generate runtime code.
This ensures good performance, but also means that is not possible to use interfaces as the type of a property being injected. There is no runtime information that could allow any reflection on interface type. Take a look at https://github.com/Microsoft/TypeScript/issues/3628 for more information about this.

So, this is not supported:

```typescript
interface PersonDAO {
  get(id: string): Person;
}

@Provides (PersonDAO) // NOT SUPPORTED
class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

class PersonService {
  @Inject // NOT SUPPORTED
  private personDAO: PersonDAO;
}
```
However there is no reason for panic. Typescript classes are much more than classes. It could have the same behavior that interfaces on other languages.

So it is possible to define an abstract class and then implement it as we do with interfaces:

```typescript
abstract class PersonDAO {
  abstract get(id: string): Person;
}

@Provides (PersonDAO) // It works
class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

class PersonService {
  @Inject // It works
  private personDAO: PersonDAO;
}
```

The abstract class in this example has exactly the same semantic that the typescript interface on the previous example. The only difference is that it generates type information into the runtime code, making possible to implement some reflection on it.


## Browser usage

It was tested with browserify and webpack, but it should work with any other similar tool.

Starting from version 2, this library only works in browsers that supports javascript ES6 '''class'''. If you need to support old ES5 browsers, please use the version 1.2.6 of this library

## Best practices

It is prefereable to configure your Singleton classes using @OnlyContainerCanInstantiate. It is safer because it ensures that all configurations will be applied even if its constructor is called directly by the code.

Configure default implementations for classes using the @Provides annotation. If you need to change the implementation for some class, you just configure it direct into IoC Container.


```typescript
abstract class PersonDAO {
  abstract get(id: string): Person;
}

@Provides (PersonDAO) 
class ProgrammerDAO implements PersonDAO {
}

// And later, if you need...
class ManagerDAO implements PersonDAO {
}

Container.bind(PersonDAO).to(ManagerDAO); //It will override any annotation
```

Another good practice is to group all your container configurations. It is easier to manage.

```typescript
export default class MyIoCConfigurations {
  static configure(){ 
    Container.bind(PersonDAO).to(ManagerDAO); 
    Container.bind(DatabaseProvider).to(MyDatabaseProvider).scope(Scope.Singleton); 
    Container.bind(RestEndPointResolver).provider(MyRestEndPoints).scope(Scope.Singleton); 
    // ...
  }
}

// and call..
MyIoCConfigurations.configure();
```

## Restrictions
- Circular injections are not supported
