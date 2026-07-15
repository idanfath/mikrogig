<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class OnboardingController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return match ($user->onboarding_step) {
            'pick_role' => inertia('onboarding/role'),
            'setup_avatar' => inertia('onboarding/avatar'),
            'profile' => inertia('onboarding/profile'),
            default => redirect()->route('app.home'),
        };
    }

    public function selectRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role' => ['required', 'in:freelancer,client'],
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->with('error', 'Peran yang dipilih tidak valid.');
        }

        $user = Auth::user();

        if ($user->role !== null) {
            return back()->with('error', 'Peran sudah dipilih sebelumnya.');
        }

        $user->role = $validator->validated()['role'];
        $user->onboarding_step = 'setup_avatar';
        $user->save();

        return redirect()->route('onboarding')->with('success', 'Peran berhasil dipilih!');
    }

    public function setupAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,webp|max:5120',
        ]);

        $user = Auth::user();
        $user->updateAvatar($request->file('avatar'));
        $user->onboarding_step = $this->nextStep($user);
        $user->save();

        return redirect()->route('onboarding')->with('success', 'Foto profil berhasil diperbarui!');
    }

    public function setupProfile(Request $request)
    {
        $user = Auth::user();

        $rules = [
            'date_of_birth' => 'required|date|before_or_equal:'.now('Asia/Jakarta')->subYears(18)->toDateString(),
            'province_id' => 'required|string|size:2',
            'regency_id' => 'required|string|size:4',
            'province_name' => 'required|string|max:255',
            'regency_name' => 'required|string|max:255',
        ];

        if ($user->role->value === 'freelancer') {
            $rules += [
                'title' => 'required|string|max:255',
                'bio' => 'required|string',
                'skills' => 'required|array|min:1',
                'skills.*' => 'string',
            ];
        }

        $validated = $request->validate($rules);

        if ($user->role->value === 'freelancer') {
            $user->freelancerProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'title' => $validated['title'],
                    'bio' => $validated['bio'],
                    'skills' => array_map('strtolower', $validated['skills']),
                ],
            );
        }

        $user->update([
            'date_of_birth' => $validated['date_of_birth'],
            'province_id' => $validated['province_id'],
            'regency_id' => $validated['regency_id'],
            'province_name' => $validated['province_name'],
            'regency_name' => $validated['regency_name'],
        ]);

        $user->onboarding_step = null;
        $user->save();

        return redirect()->route('app.home')->with('success', 'Profil berhasil dilengkapi!');
    }

    // BEHOLD!!!! SUCH ABOMINATION OF A CODE!!!!!!!!!!!!!!!!!
    public function enhanceInputField(Request $request)
    {
        $validated = $request->validate([
            'field' => 'required|in:title,bio,skills',
            'value' => 'nullable|string',
            'context' => 'nullable|array',
        ]);

        $field = $validated['field'];
        $value = $validated['value'] ?? null;
        $context = $validated['context'] ?? [];

        $aiService = app(AiService::class);

        $contextInfo = '';
        if (! empty($context['skills'])) {
            $skillsList = is_array($context['skills']) ? implode(', ', $context['skills']) : $context['skills'];
            $contextInfo .= "\nKeahlian / Skills: ".$skillsList;
        }

        if ($field === 'title') {
            $systemPrompt = config('ai.prompts.enhance_title');

            $userMessage = 'Original Title: '.$value;
            if ($contextInfo) {
                $userMessage .= "\n\nAdditional Context:".$contextInfo;
            }
        } elseif ($field === 'bio') {
            if (! empty($context['title'])) {
                $contextInfo .= "\nJudul Profil: ".$context['title'];
            }

            $systemPrompt = config('ai.prompts.enhance_bio');

            $userMessage = 'Original Bio: '.$value;
            if ($contextInfo) {
                $userMessage .= "\n\nAdditional Context:".$contextInfo;
            }
        } else {
            $systemPrompt = config('ai.prompts.enhance_skills');
            $userMessage = 'Judul Profil: '.($context['title'] ?? '')."\nBio: ".($context['bio'] ?? '');
        }

        try {
            $options = [];
            $model = config('ai.model', '');

            $enhancedValue = $aiService->chat($systemPrompt, $userMessage, $options);

            $cleanValue = trim($enhancedValue);
            $cleanValue = preg_replace('/<think>.*?<\/think>/is', '', $cleanValue);
            $cleanValue = trim($cleanValue);

            // check if the response is JSON
            $isJson = false;
            $parsedJson = null;
            if (str_starts_with($cleanValue, '{') || str_starts_with($cleanValue, '[')) {
                $raw = $cleanValue;
                // strip markdown if any
                if (str_starts_with($raw, '```')) {
                    $raw = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $raw);
                }
                $decoded = json_decode(trim($raw), true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $isJson = true;
                    $parsedJson = $decoded;
                }
            }

            if ($field === 'skills') {
                $parsedValue = [];
                if ($isJson) {
                    $parsedValue = $parsedJson;
                    // if it is wrapped in an associative array ({"keahlian": [...]})
                    if (is_array($parsedValue) && count($parsedValue) > 0 && ! array_is_list($parsedValue)) {
                        $firstVal = reset($parsedValue);
                        if (is_array($firstVal)) {
                            $parsedValue = $firstVal;
                        }
                    }
                } else {
                    $cleaned = preg_replace('/[\[\]"\'`]/', '', $cleanValue);
                    $parsedValue = array_map('trim', explode(',', $cleaned));
                }

                $parsedValue = array_filter(array_map('strtolower', $parsedValue));

                return response()->json([
                    'value' => array_values($parsedValue),
                ]);
            }

            // for title and bio, extract standard keys if returned in JSON object
            $resultString = $cleanValue;
            if ($isJson && is_array($parsedJson)) {
                if (isset($parsedJson[$field])) {
                    $resultString = $parsedJson[$field];
                } elseif (isset($parsedJson['value'])) {
                    $resultString = $parsedJson['value'];
                } else {
                    $firstVal = reset($parsedJson);
                    if (is_string($firstVal)) {
                        $resultString = $firstVal;
                    }
                }
            }

            $resultString = preg_replace('/^["\'`]|["\'`]$/', '', $resultString);

            return response()->json([
                'value' => trim($resultString),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal meningkatkan input dengan AI.',
            ], 500);
        }
    }

    public function skip(Request $request)
    {
        $user = Auth::user();
        $user->onboarding_step = $this->nextStep($user);
        $user->save();

        return redirect()->route('onboarding');
    }

    private function nextStep(User $user): ?string
    {
        return match ($user->onboarding_step) {
            'setup_avatar' => 'profile',
            'profile' => null,
            default => $user->onboarding_step,
        };
    }
}
