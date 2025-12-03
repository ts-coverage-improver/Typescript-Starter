declare const global: any;
declare const window: any;
declare const self: any;

function getGlobalScope(): any {
    if (typeof window !== "undefined") {
        return window;
    }
    if (typeof self !== "undefined") {
        return self;
    }
    if (typeof global !== "undefined") {
        return global;
    }
    return undefined;
}

class Student {
    fullName: string;
    constructor(public firstName, public middleInitial, public lastName) {
        this.fullName = firstName + " " + middleInitial + " " + lastName;
    }
}

interface Person {
    firstName: string;
    lastName: string;
}

function greeter(person : Person) {
    return "Hello, " + person.firstName + " " + person.lastName;
}

var scope = getGlobalScope();
if (scope && !scope.tsGreeter) {
    scope.tsGreeter = {
        Student: Student,
        greeter: greeter
    };
}

var user = new Student("Jane", "M.", "User");

if (typeof document !== "undefined" && document.body) {
    document.body.innerHTML = greeter(user);
}
