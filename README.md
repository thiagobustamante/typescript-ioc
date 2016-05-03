# IoC Container for Typescript
This is a lightweight annotation-based dependency injection container for typescript.

It can be used on browser or on node.js server code.

**Table of Contents** 

- [IoC Container for Typescript](#)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Basic Usage](#basic-usage)
  - [@Scoped](#scopes)
  - [@Provider](#providers)
  - [@Provides](#providing-implementation-for-base-classes)
  - [@AutoWired](#the-container-and-the-autowired-annotation)
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
import {AutoWired, Inject} from "typescript-ioc";

@AutoWired
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
@AutoWired
class PersonService {
  private personDAO: PersonDAO;
  constructor( @Inject personDAO: PersonDAO ) {
    this.personDAO = personDAO;
  }
}
```

and then, if you make an injection to this class, like...

```typescript
@AutoWired
class PersonController {
  @Inject
  private personService: PersonService;
}
```

The container will create an instance of PersonService that receives the PersonDAO from the container on its constructor.
But you still can call:

```typescript
let personService: PersonService = new PersonService(myPersonDAO);
```

And pass your own instance of PersonDAO to PersonService.

Note that any type that have a constructor can be injected, not only the types that you decorate with @AutoWired.

```typescript
@AutoWired
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
@AutoWired
class abstract BaseDAO {
  @Inject
  creationTime: Date;
}

@AutoWired
class PersonDAO extends BaseDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

@AutoWired
class ProgrammerDAO extends PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;
}
```

The above example will work as expected.

## Scopes

You can use scopes to manage your instances as:

```typescript
@AutoWired 
@Singleton 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}

@AutoWired
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

We have two pre defined scopes (Scope.Singleton and Scope.Local), but you can define your own custom Scope. You just have to extends the Scope abstract class;

```typescript
class MyScope extends Scope { 
  resolve(iocProvider:Provider, source:Function) {
    console.log('created by my custom scope.')
    return iocProvider.get();
  }
}
@AutoWired
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
@AutoWired
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
@AutoWired
class PersonDAO extends BaseDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

@AutoWired
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

## The Container and the @AutoWired annotation
The @AutoWired annotation transforms the annotated class, changing its constructor. So, any auto wired class will have its instantiation delegated to the IoC Container that will handle all injections automatically.

But this is not the only way you can interact with the IoC Container. You can bind types to Container resolution and also ask Container to return the instances.

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
// personDAO.personRestProxy is defined. It was resolved by Container.

let otherPersonDAO: PersonDAO = new PersonDAO(); 
// personDAO.personRestProxy is not defined. It was not resolved by Container.
```

Or

```typescript
@AutoWired
class PersonDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

Container.bind(PersonDAO); // it is not necessary, but does not destroy anything
let personDAO: PersonDAO = Container.get(PersonDAO); 
// personDAO.personRestProxy is defined. It was resolved by Container.

let otherPersonDAO: PersonDAO = new PersonDAO(); 
// personDAO.personRestProxy is defined. It was also resolved by Container.
```

More examples of AutoWired and non AutoWired usage with Container interface:

```typescript
@AutoWired
class PersonDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

const personProvider: Provider = { 
  get: () => { return new PersonDAO(); }
};

Container.bind(PersonDAO).provider(personProvider); 
let personDAO: PersonDAO = Container.get(PersonDAO); 
// personDAO.personRestProxy is defined. It was resolved by Container.

let otherPersonDAO: PersonDAO = new PersonDAO(); 
// personDAO.personRestProxy is defined. It was also resolved by Container.
// The call to new PersonDAO(), even when made inside the provider code, 
// is handled by IoC Container.
```
```typescript
class ProgrammerDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

const programmerProvider: Provider = { 
  get: () => { return new ProgrammerDAO(); }
};

Container.bind(ProgrammerDAO).provider(programmerProvider); 
let personDAO: PersonDAO = Container.get(PersonDAO); 
// personDAO.personRestProxy is NOT defined. The call to new PersonDAO(),
// made inside the provider code,  was not handled by IoC Container.
// In that situation, the provider should handle the injections by itself.
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

## A note about classes and interfaces

Typescript interfaces only exists at development time, to ensure type checkings. When compiled, they generates nothing to runtime code.
It ensures a good performance, but also means that is not possible to use interfaces as the type of a property being injected. There is no runtime information that could allow any reflection on interface type. Take a look at https://github.com/Microsoft/TypeScript/issues/3628 for more information about this.

So, this is not supported:

```typescript
interface PersonDAO {
  get(id: string): Person;
}

@AutoWired
@Provides (PersonDAO) // NOT SUPPORTED
class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

@AutoWired
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

@AutoWired
@Provides (PersonDAO) // It works
class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

@AutoWired
class PersonService {
  @Inject // It works
  private personDAO: PersonDAO;
}
```

The abstract class in this example, has exactly the same semantic that the typescript interface on the previous example. The only difference is that it generates type information into the runtime code, making possible to implement some reflection on it.

## Browser usage

It was tested with browserify and webpack, but it should work with any other similar tool.

## Best practices

It is prefereable to configure your classes using @AutoWired. It is safer because ensure that all configurations will be applied even if its constructor is called directly by the code.

Configure default implementations for classes using @Provides annotation. If you need to change the implementation for some class, you just configure it direct into IoC Container.


```typescript
abstract class PersonDAO {
  abstract get(id: string): Person;
}

@AutoWired
@Provides (PersonDAO) 
class ProgrammerDAO implements PersonDAO {
}

// And later, if you need...
@AutoWired
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
