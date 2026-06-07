import '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import './src/style.css'; // Allows testing Tailwind classes locally

expect.extend(matchers);