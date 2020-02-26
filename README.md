[![npm version](https://badge.fury.io/js/typescript-ioc.svg)](https://badge.fury.io/js/typescript-ioc)
[![Build Status](https://travis-ci.org/thiagobustamante/typescript-ioc.png?branch=master)](https://travis-ci.org/thiagobustamante/typescript-ioc)
[![Coverage Status](https://codecov.io/gh/thiagobustamante/typescript-ioc/branch/master/graph/badge.svg)](https://codecov.io/gh/thiagobustamante/typescript-ioc)
[![Known Vulnerabilities](https://snyk.io/test/github/thiagobustamante/typescript-ioc/badge.svg?targetFile=package.json)](https://snyk.io/test/github/thiagobustamante/typescript-ioc?targetFile=package.json)

# IoC Container for Typescript - 3.X
This is a lightweight annotation-based dependency injection container for typescript.

It can be used on browser, on react native or on node.js server code.

**The documentation for the previous version can be found [here](https://github.com/thiagobustamante/typescript-ioc/wiki/Typescript-IoC-1.x)**


**Table of Contents** 

- [IoC Container for Typescript](#)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Basic Usage](#basic-usage)
  - [Scopes](#scopes)
    - [Singleton Scope](#singleton)
    - [Request Scope](#inrequestscope)
    - [Local Scope](#local-scope)
    - [Custom Scopes](#custom-scopes)
  - [@Factory](#factories)
  - [@OnlyContainerCanInstantiate](#the-onlycontainercaninstantiate-annotation)
  - [@The Container Class](#the-container-class)
    - [Creating temporary configurations](#creating-temporary-configurations)
    - [Importing configurations from external file](#importing-configurations-from-external-file)
  - [A note about classes and interfaces](#a-note-about-classes-and-interfaces)
  - [Browser usage](#browser-usage)
  - [Restrictions](#restrictions)
  - [Examples](#examples)
    - [Using Container for testing](#using-container-for-testing)

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

You can use scopes to manage your instances. We have three pre defined scopes (Scope.Singleton, Scope.Request and Scope.Local), but you can define your own custom Scope.

### @Singleton

Allow just one instance for each type bound to this scope.

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

### @InRequestScope

Types bound to this scope will share instances between the same build context. When you call ```Container.get```, a new build context is created and every container resolution performed will share this context.

For example:

```typescript
@InRequestScope
class RequestScopeClass {}

class FirstClass {
    @Inject
    public a: RequestScopeClass;
}

class SecondClass {
    @Inject
    public a: RequestScopeClass;
    @Inject
    public b: FirstClass;
}

```

In that example, we can expect:

```typescript
const secondClass = Container.get(SecondClass);
expect(secondClass.a).toEqual(secondClass.b.a);
```

### Local Scope

The container will create a new instance every time it will be asked to retrieve objects for types bound to the Local scope.

The Local scope is the default scope. So you don't need to configure nothing to work with a Local scope. However if you have a Type bound to other scope and want to change it to the Local scope, you can use the ```Scope.Local``` property:

```typescript
@Singleton
class MyType {}

Container.bind(MyType).scope(Scope.Local);
```

### Custom Scopes
 To define a new scope, you just have to extend the Scope abstract class:

```typescript
class MyScope extends Scope { 
  resolve(factory: ObjectFactory, source:Function, context: BuildContext) {
    console.log('created by my custom scope.')
    return factory(context);
  }
}
@Scoped(new MyScope()) 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}
```

## Factories

Factories can be used as to create the instances inside the IoC Container.

```typescript
const personFactory: ObjectFactory = () => new PersonService(); 
@Scoped(new MyScope()) 
@Factory(personFactory)
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

Will prodeuce a TypeError. 

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

const personFactory: ObjectFactory = () => new PersonDAO();
Container.bind(PersonDAO).factory(personFactory); //Works OK

let personDAO = Container.get(PersonDAO); // Works OK
```

### Creating temporary configurations

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
import { MyType, MyTypeImpl, MyType2, MyType2Factory } from './my-types';
import { Scope } from 'typescript-ioc';

export default [
  { bind: MyType, to: MyTypeImpl },
  { 
    bind: MyType2, 
    factory: MyType2Factory, 
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

## Examples

### Using Container for testing

Some examples of using the container for tests:

```typescript
describe('My Test', () => {
    let myService: MyService;
    beforeAll(() => {
        class MockRepository implements AuthenticationRepository {
          async getAccessToken() {
            return 'my test token';
          }
        }
        Container.bind(AuthenticationRepository).to(MockRepository)
        myService = Container.get(MyService);
    });
    //...
});
```
or you can configure all your mocks togheter in a mocks.config.ts

```typescript
class MockRepository implements AuthenticationRepository {
  async getAccessToken() {
    return 'my test token';
  }
}

class OtherMockRepository implements OtherRepository {
  async doSomething() {
    return 'done';
  }
}

export default [
  { bind: AuthenticationRepository, to: MockRepository },
  { bind: OtherRepository, to: OtherMockRepository }
];
```

and then in your test files:

```typescript
import mocksConfig from './mocks.config.ts';

describe('My Test', () => {
    let myService: MyService;
    beforeAll(() => {
        Container.config(mocksConfig);
        myService = Container.get(MyService);
    });
    //...
});
```
or if you want to use the configurations and restore the container after the test:

```typescript
import mocksConfig from './mocks.config.ts';

describe('My Test', () => {
    let myService: MyService;
    let snaphot: Snaphot;
    beforeAll(() => {
        snapshot = Container.snapshot(MyService);
        Container.config(mocksConfig);
        myService = Container.get(MyService);
    });

    afterAll(() => {
        snapshot.restore();
    });

    //...
});
```

## Browser usage

It was tested with browserify and webpack, but it should work with any other similar tool.

Starting from version 2, this library only works in browsers that supports javascript ES6 '''class'''. If you need to support old ES5 browsers, please use the version 1.2.6 of this library

## Restrictions
- Circular injections are not supported

