<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;

#[Signature('enum:make {name} {--values=}')]
#[Description('Create a new enum class with optionally the specified name and values.')]
class CreateEnum extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(Filesystem $files): int
    {
        $name = trim((string) $this->argument('name'));

        if ($name === '') {
            $this->error('The enum name is required.');

            return self::FAILURE;
        }

        [$namespace, $className, $filePath] = $this->resolveDestination($name);

        if ($files->exists($filePath)) {
            $this->error("Enum already exists at {$filePath}.");

            return self::FAILURE;
        }

        $cases = $this->parseCases((string) $this->option('values'));

        if ($cases === null) {
            return self::FAILURE;
        }

        $files->ensureDirectoryExists(dirname($filePath));
        $files->put($filePath, $this->buildEnumContent($namespace, $className, $cases));

        $this->info("Enum created: {$namespace}\\{$className}");
        $this->line("Path: {$filePath}");

        return self::SUCCESS;
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function resolveDestination(string $name): array
    {
        $normalized = str_replace('/', '\\', trim($name, '\\'));

        if ($normalized === '') {
            return ['App\Enums', 'EnumName', app_path('Enums/EnumName.php')];
        }

        if (! str_starts_with($normalized, 'App\\')) {
            if (str_starts_with($normalized, 'Enums\\')) {
                $normalized = 'App\\'.$normalized;
            } else {
                $normalized = 'App\\Enums\\'.$normalized;
            }
        }

        $segments = array_values(array_filter(explode('\\', $normalized), fn (string $segment): bool => $segment !== ''));

        $className = Str::studly((string) array_pop($segments));
        $namespaceSegments = array_map(fn (string $segment): string => Str::studly($segment), $segments);

        if ($namespaceSegments[0] !== 'App') {
            array_unshift($namespaceSegments, 'App');
        }

        $namespace = implode('\\', $namespaceSegments);
        $relativePath = implode('/', array_slice($namespaceSegments, 1)).'/'.$className.'.php';

        return [$namespace, $className, app_path($relativePath)];
    }

    /**
     * @return array<int, array{name: string, value: string}>|null
     */
    private function parseCases(string $valuesOption): ?array
    {
        $valuesOption = trim($valuesOption);

        if ($valuesOption === '') {
            return [];
        }

        $parts = array_values(array_filter(array_map('trim', explode(',', $valuesOption)), fn (string $part): bool => $part !== ''));
        $cases = [];

        foreach ($parts as $part) {
            if (str_contains($part, '=')) {
                [$caseName, $value] = array_map('trim', explode('=', $part, 2));
            } else {
                $value = $part;
                $caseName = Str::studly($part);
            }

            $normalizedCase = $this->normalizeCaseName($caseName);

            if ($normalizedCase === null) {
                $this->error("Invalid enum case name [{$caseName}].");

                return null;
            }

            if ($value === '') {
                $this->error("Invalid enum value in [{$part}].");

                return null;
            }

            $cases[] = [
                'name' => $normalizedCase,
                'value' => $value,
            ];
        }

        return $cases;
    }

    private function normalizeCaseName(string $name): ?string
    {
        $candidate = Str::studly($name);
        $candidate = preg_replace('/[^A-Za-z0-9_]/', '', $candidate) ?? '';

        if ($candidate === '' || ctype_digit($candidate[0])) {
            return null;
        }

        return $candidate;
    }

    /**
     * @param  array<int, array{name: string, value: string}>  $cases
     */
    private function buildEnumContent(string $namespace, string $className, array $cases): string
    {
        $lines = [
            '<?php',
            '',
            "namespace {$namespace};",
            '',
            "enum {$className}: string",
            '{',
        ];

        foreach ($cases as $case) {
            $escapedValue = str_replace(['\\', "'"], ['\\\\', "\'"], $case['value']);
            $lines[] = "  case {$case['name']} = '{$escapedValue}';";
        }

        if ($cases !== []) {
            $defaultCaseName = $cases[0]['name'];

            $lines[] = '';
            $lines[] = '  public static function defaultValue(): string';
            $lines[] = '  {';
            $lines[] = "    return self::{$defaultCaseName}->value;";
            $lines[] = '  }';
            $lines[] = '';
            $lines[] = '  public static function values(): array';
            $lines[] = '  {';
            $lines[] = "    return array_column(self::cases(), 'value');";
            $lines[] = '  }';
        }

        $lines[] = '}';
        $lines[] = '';

        return implode(PHP_EOL, $lines);
    }
}
