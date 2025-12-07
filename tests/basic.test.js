import request from 'supertest';
import express from 'express';

// Mock simple para pruebas si no queremos levantar todo el server real
// Pero para integración, mejor importar app.
// Dado que index.js levanta el server automáticamente, esto es tricky con Jest.
// Lo ideal es separar app de listen().
// Por ahora, haremos un test E2E asumiendo que el server está corriendo o 
// hacer un mock.
// Vamos a hacer una prueba TRIVIAL unitaria primero para verificar Jest.

describe('Pruebas Básicas', () => {
  test('La suma de 1 + 1 debe ser 2', () => {
    expect(1 + 1).toBe(2);
  });
});
