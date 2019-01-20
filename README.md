[![npm version](https://badge.fury.io/js/typescript-ioc.svg)](https://badge.fury.io/js/typescript-ioc)
[![Build Status](https://travis-ci.org/thiagobustamante/typescript-ioc.png?branch=master)](https://travis-ci.org/thiagobustamante/typescript-ioc)
[![Coverage Status](https://coveralls.io/repos/github/thiagobustamante/typescript-ioc/badge.svg)](https://coveralls.io/github/thiagobustamante/typescript-ioc)
[![Known Vulnerabilities](https://snyk.io/test/github/thiagobustamante/typescript-ioc/badge.svg?targetFile=package.json)](https://snyk.io/test/github/thiagobustamante/typescript-ioc?targetFile=package.json)

# IoC Container for Typescript
This is a lightweight annotation-based dependency injection container for typescript.

It can be used on browser or on node.js server code.

**Project Sponsors**

This project is supported by [Leanty](https://github.com/Leanty/)'s team and is widely used by its main product: The [Tree Gateway](http://www.treegateway.org) API Gateway.

**Table of Contents** 

- [IoC Container for Typescript](#)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Basic Usage](#basic-usage)
  - [@Scoped](#scopes)
  - [@Provider](#providers)
  - [@Provides](#providing-implementation-for-base-classes)
  - [@AutoWired](#the-autowired-annotation)
  - [@The Container Class](#the-container-class)
    - [Registering from multiple files](#registering-from-multiple-files)
  - [A note about classes and interfaces](#a-note-about-classes-and-interfaces)
  - [ES6 Output](#es6-output)
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
import {AutoWired, Inject} from "typescript-ioc";

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

## The @AutoWired annotation
The @AutoWired annotation transforms the annotated class, changing its constructor. So, any auto wired class will have its instantiation delegated to the IoC Container even when its constructor is called directly.

It is usefull, for example, to avoid direct instantiation of Singletons.

```typescript
@Singleton 
@AutoWired 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}
```

If anybody try to invoke: 
```typescript
new PersonService();
```

That instantiation will be delegated to the container. In the case of a Singleton class, the container will not allow more than one instantiation and it could cause a TypeError.

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

You can use the Ioc Container with AutoWired classes and with non AutoWired classes.

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

Singleton scopes also received a special handling.

```typescript
@AutoWired
@Singleton
class PersonDAO {
}

let p: PersonDAO = new PersonDAO(); // throws a TypeError. Autowired Singleton classes can not be instantiated

const personProvider: Provider = { 
  get: () => { return new PersonDAO(); }
};
Container.bind(PersonDAO).provider(personProvider); //Works OK

Container.bind(PersonDAO).scope(Scope.Local); // Now you are able to instantiate again
let p: PersonDAO = new PersonDAO(); // Works again.
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

## ES6 Output

Starting from version 0.4.0, Typescript-ioc supports configure the target version of generated javascript to es6. Previous versions only works with es5 as target.

To configure a node.js project to work with es6, you need to configure your tsconfig.json as:

```typescript
{
  "compilerOptions": {
    "target": "es6",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

And need to inform which version of the library you want to import. In Node JS environment, you can create a file called ```ioc.config``` in the project root dir with the content:

```typescript
{
   "es6": true
}
```

In the place of use this ```ioc.config``` file, you can change your import declaration to import the module 'typescript/es6'.

```typescript
import {Inject} from "typescript-ioc/es6";
```

## Browser usage

It was tested with browserify and webpack, but it should work with any other similar tool.

To use with those tools, you must ensure you are importing the specific library version that is compatible with your javascript version (the compiled javascript version).

If you are using `compilerOtions.target = es5` in your tsconfig.json file, ensure you import the library as:

```typescript
import {AutoWired, Inject} from "typescript-ioc/es5";
```

If you are using `compilerOtions.target = es6` or any newer version import as:

```typescript
import {AutoWired, Inject} from "typescript-ioc/es6";
```

When you import the default library version 

```typescript
import {AutoWired, Inject} from "typescript-ioc";
```

The library will try to identify the appropriated javascript version dynamically (es5 or es6). The approach used here is not compatible with browserify, webpack and other package tools.

## Best practices

It is prefereable to configure your Singleton classes using @AutoWired. It is safer because it ensures that all configurations will be applied even if its constructor is called directly by the code.

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
- You can only inject types that are already defined into your file. It can be solved by a @LazyInject on future releases
