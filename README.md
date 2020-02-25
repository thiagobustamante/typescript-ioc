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
  - [@OnlyContainerCanInstantiate](#the-onlycontainercaninstantiate-annotation)
  - [@The Container Class](#the-container-class)
    - [Importing configurations from external file](#importing-configurations-from-external-file)
  - [A note about classes and interfaces](#a-note-about-classes-and-interfaces)
  - [Browser usage](#browser-usage)
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

You can use snapshot for testing or where you need to temporarily override a binding.
```typescript
describe('Test Service with Mocks', () => {

    const snapshot: Snapshot;
    before(function () {
        // Hack for lazy loading (mentioned elsewhere in docs)
        MyIoCConfigurations.configure();

        // Store the IoC configuration for IService
        snapshot = Container.snapshot(IService);
        
        // Change the IoC configuration to a mock service.
        Container.bind(IService).to(MockService);
    });

    after(function () {
        // Put the IoC configuration back for IService, so other tests can run.
        snapshot.restore();
    });

    it('Should do a test', () => {
        // Do some test
    });
});
```

### Importing configurations from external file

You can put all manual container configurations in an external file and then use the '''Container.configure''' method to import them.

For example, you can create the ```ioc.config.ts``` file:

```typescript
import { MyType, MyTypeImpl, MyType2, MyType2Provider } from './my-types';
import { Scope } from 'typescript-ioc';

export default [
  { bind: MyType, to: MyTypeImpl },
  { 
    bind: MyType2, 
    provider: MyType2Provider, 
    withParams: [Date], 
    scope: Scope.Singleton 
  }
];

```

And then import the configurations using:

```typescript
import { Container } from "typescript-ioc";
import config from './ioc.config';

Container.configure(config);
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

class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

Container.bind(PersonDAO).to(ProgrammerDAO); // NOT SUPPORTED

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

class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

Container.bind(PersonDAO).to(ProgrammerDAO); // It works

class PersonService {
  @Inject // It works
  private personDAO: PersonDAO;
}
```

The abstract class in this example has exactly the same semantic that the typescript interface on the previous example. The only difference is that it generates type information into the runtime code, making possible to implement some reflection on it.


## Browser usage

It was tested with browserify and webpack, but it should work with any other similar tool.

Starting from version 2, this library only works in browsers that supports javascript ES6 '''class'''. If you need to support old ES5 browsers, please use the version 1.2.6 of this library

## Restrictions
- Circular injections are not supported
