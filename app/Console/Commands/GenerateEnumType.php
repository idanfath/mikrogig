<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use BackedEnum;
use UnitEnum;

#[Signature('enum:types')]
#[Description('This will update the TypeScript enum files based on the PHP enum classes.')]
class GenerateEnumType extends Command
{
  /**
   * Execute the console command.
   */
  public function handle(Filesystem $files): int
  {
    $enumDirectory = app_path('Enums');
    $outputDirectory = resource_path('js/types');
    $outputFile = $outputDirectory . DIRECTORY_SEPARATOR . 'enum.ts';

    if (!$files->isDirectory($enumDirectory)) {
      $this->error('The app/Enums directory does not exist.');

      return self::FAILURE;
    }

    $definitions = $this->buildDefinitions($files, $enumDirectory);

    $files->ensureDirectoryExists($outputDirectory);
    $files->put($outputFile, $this->buildTypescriptFile($definitions));

    $this->info('Generated TypeScript enum definitions.');
    $this->line('Path: ' . $outputFile);

    return self::SUCCESS;
  }

  /**
   * @return array<int, array{name: string, cases: array<int, array{name: string, value: string}>}>
   */
  private function buildDefinitions(Filesystem $files, string $enumDirectory): array
  {
    $definitions = [];

    foreach ($files->allFiles($enumDirectory) as $file) {
      $className = $this->resolveEnumClassName($enumDirectory, $file->getRealPath());

      if ($className === null || !enum_exists($className)) {
        continue;
      }

      $cases = [];

      foreach ($className::cases() as $case) {
        $cases[] = [
          'name' => $case->name,
          'value' => $this->resolveCaseValue($case),
        ];
      }

      if ($cases === []) {
        continue;
      }

      $definitions[] = [
        'name' => class_basename($className),
        'cases' => $cases,
      ];
    }

    usort($definitions, fn(array $left, array $right): int => $left['name'] <=> $right['name']);

    return $definitions;
  }

  private function resolveEnumClassName(string $enumDirectory, string|false $realPath): ?string
  {
    if ($realPath === false) {
      return null;
    }

    $relativePath = substr($realPath, strlen($enumDirectory) + 1);

    if ($relativePath === false || !str_ends_with($relativePath, '.php')) {
      return null;
    }

    $classPath = substr($relativePath, 0, -4);

    if ($classPath === false || $classPath === '') {
      return null;
    }

    return 'App\\Enums\\' . str_replace(DIRECTORY_SEPARATOR, '\\', $classPath);
  }

  private function resolveCaseValue(UnitEnum $case): string
  {
    if ($case instanceof BackedEnum) {
      return (string) $case->value;
    }

    return $case->name;
  }

  /**
   * @param array<int, array{name: string, cases: array<int, array{name: string, value: string}>}> $definitions
   */
  private function buildTypescriptFile(array $definitions): string
  {
    if ($definitions === []) {
      return "export {};\n";
    }

    $lines = [];

    foreach ($definitions as $definition) {
      $lines[] = 'export const ' . $definition['name'] . ' = {';

      foreach ($definition['cases'] as $case) {
        $lines[] = '  ' . $case['name'] . ': ' . json_encode($case['value'], JSON_THROW_ON_ERROR) . ',';
      }

      $lines[] = '} as const;';
      $lines[] = 'export type ' . $definition['name'] . ' = typeof ' . $definition['name'] . '[keyof typeof ' . $definition['name'] . ']';
      $lines[] = '';
    }

    array_pop($lines);
    $lines[] = '';

    return implode(PHP_EOL, $lines);
  }
}
