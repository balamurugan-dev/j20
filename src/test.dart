// To parse this JSON data, do
//
//     final welcome = welcomeFromJson(jsonString);

import 'dart:convert';

Welcome welcomeFromJson(String str) => Welcome.fromJson(json.decode(str));

String welcomeToJson(Welcome data) => json.encode(data.toJson());

class Welcome {
    List<Employee> employees;

    Welcome({
        required this.employees,
    });

    factory Welcome.fromJson(Map<String, dynamic> json) => Welcome(
        employees: List<Employee>.from(json["employees"].map((x) => Employee.fromJson(x))),
    );

    Map<String, dynamic> toJson() => {
        "employees": List<dynamic>.from(employees.map((x) => x.toJson())),
    };
}

class Employee {
    String name;
    String email;

    Employee({
        required this.name,
        required this.email,
    });

    factory Employee.fromJson(Map<String, dynamic> json) => Employee(
        name: json["name"],
        email: json["email"],
    );

    Map<String, dynamic> toJson() => {
        "name": name,
        "email": email,
    };
}
