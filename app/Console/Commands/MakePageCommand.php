<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

class MakePageCommand extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'make:page {name? : The name of the page} {--layout= : The layout to use}';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Create a new Inertia React page component';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    $name = $this->argument('name');

    if (!$name) {
      $name = text(
        label: 'What is the page name?',
        placeholder: 'e.g. auth/register',
        required: true
      );
    }

    // Clean name (remove extension if provided)
    $name = Str::replaceLast('.tsx', '', $name);
    $name = Str::replaceLast('.jsx', '', $name);

    $layout = $this->option('layout');
    $layouts = $this->getAvailableLayouts();

    if (!$layout && !empty($layouts)) {
      $layout = select(
        label: 'Which layout should be used?',
        options: array_merge(['None'], $layouts),
        default: 'None'
      );
    }

    if ($layout === 'None') {
      $layout = null;
    }

    $this->generatePage($name, $layout);

    return self::SUCCESS;
  }

  /**
   * Get available layouts from resources/js/layout.
   */
  protected function getAvailableLayouts(): array
  {
    $directory = resource_path('js/layout');

    if (!File::isDirectory($directory)) {
      return [];
    }

    return collect(File::files($directory))
      ->map(fn($file) => $file->getBasename('.tsx'))
      ->toArray();
  }

  /**
   * Generate the page component.
   */
  protected function generatePage(string $name, ?string $layout): void
  {
    $path = resource_path('js/pages/' . $name . '.tsx');
    $directory = dirname($path);

    if (!File::isDirectory($directory)) {
      File::makeDirectory($directory, 0755, true);
    }

    if (File::exists($path)) {
      $this->error("Page already exists: {$name}");
      return;
    }

    $componentName = basename($name);
    $componentName = Str::studly($componentName);

    $content = $this->getTemplate($componentName, $layout);

    File::put($path, $content);

    $this->info("Page created successfully: resources/js/pages/{$name}.tsx");
  }

  /**
   * Get the page component template.
   */
  protected function getTemplate(string $componentName, ?string $layout): string
  {
    $imports = [
      "import { Head } from '@inertiajs/react';",
      "import { ReactElement, ReactNode } from 'react';",
    ];

    if ($layout) {
      $imports[] = "import {$layout} from '@/layout/{$layout}';";
    }

    $template = implode("\n", $imports) . "\n\n";

    $template .= "type InertiaPageWithLayout = (() => ReactElement) & {\n";
    $template .= "  layout?: (page: ReactNode) => ReactNode;\n";
    $template .= "};\n\n";

    $template .= "const {$componentName}: InertiaPageWithLayout = () => {\n";
    $template .= "    return (\n";
    $template .= "      <>\n";
    $template .= "        <Head title=\"{$componentName}\" />\n";
    $template .= "        <div className=\"p-6\">\n";
    $template .= "            <h1 className=\"text-2xl font-bold\">{$componentName} Page</h1>\n";
    $template .= "            <p className=\"mt-4\">Start building your page here.</p>\n";
    $template .= "        </div>\n";
    $template .= "      </>\n";
    $template .= "    );\n";
    $template .= "}\n\n";

    if ($layout) {
      $template .= "{$componentName}.layout = (page: ReactNode) => <{$layout}>{page}</{$layout}>;\n\n";
    }

    $template .= "export default {$componentName};\n";

    return $template;
  }
}
