{{--
DOCUMENTATION
- header
- heading
- text
- button
- image
- divider
- spacer
- footer
--}}

<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Notification' }}</title>
    <style>
        body {
            background-color: #f5f5f5;
            font-family: 'Poppins', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .mono {
            font-family: 'Roboto Mono', ui-monospace, Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }

        .email-container {
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 0;
            border: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            margin: 0 auto;
            overflow: hidden;
            border-collapse: collapse;
        }

        .content-padding {
            padding: 40px 48px;
        }

        .header-section {
            margin-bottom: 32px;
            text-align: left;
            border-bottom: 3px solid #e11d48;
            padding-bottom: 24px;
        }

        .app-name {
            font-size: 20px;
            font-weight: 700;
            text-transform: none;
            letter-spacing: 0;
            color: #e11d48;
            margin: 8px 0 0 0;
        }

        .logo-img {
            max-width: 80px;
            display: inline-block;
        }

        .heading {
            font-weight: 600;
            color: #1a1a1a;
            line-height: 1.3;
            margin-top: 0;
            margin-bottom: 16px;
        }

        .heading-1 {
            font-size: 28px;
            color: #e11d48;
        }

        .heading-2 {
            font-size: 22px;
        }

        .heading-3 {
            font-size: 18px;
        }

        .text-p {
            color: #4a4a4a;
            line-height: 1.7;
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 15px;
        }

        .btn-container {
            margin-bottom: 32px;
        }

        .btn-center {
            text-align: center;
        }

        .btn-left {
            text-align: left;
        }

        .btn-right {
            text-align: right;
        }

        .btn {
            display: inline-block;
            padding: 14px 32px;
            border-radius: 4px;
            font-weight: 600;
            text-transform: none;
            font-size: 14px;
            letter-spacing: 0;
            text-decoration: none;
            color: #ffffff !important;
            background-color: #e11d48;
            transition: background-color 0.2s ease;
        }

        .btn:hover {
            background-color: #be123c;
        }

        .divider {
            border: 0;
            border-top: 1px solid #e5e5e5;
            margin: 28px 0;
        }

        .img-container {
            margin-bottom: 28px;
            text-align: center;
        }

        .img-responsive {
            max-width: 100%;
            border-radius: 4px;
        }

        .footer-section {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            font-size: 12px;
            color: #6b6b6b;
            font-family: 'Poppins', 'Segoe UI', Roboto, sans-serif;
            text-transform: none;
            letter-spacing: 0;
        }

        .meta-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #9ca3af;
            font-family: 'Poppins', 'Segoe UI', Roboto, sans-serif;
            text-transform: none;
            letter-spacing: 0;
        }
    </style>
</head>

<body>
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container">
        <tr>
            <td class="content-padding">
                @php
                    $blocks = $blocks ?? [];
                    $has_header = collect($blocks)->contains('type', 'header');
                    $has_footer = collect($blocks)->contains('type', 'footer');
                @endphp

                {{-- Default Header --}}
                @if (!($hide_header ?? false) && !$has_header)
                    <div class="header-section">
                        <img src="{{ asset('favicon.svg') }}" alt="{{ config('app.name') }}" class="logo-img">
                        <h1 class="app-name">{{ config('app.name') }}</h1>
                    </div>
                @endif

                @if (isset($blocks) && is_array($blocks))
                    @foreach ($blocks as $block)
                        @switch($block['type'] ?? 'text')
                            @case('header')
                                <div class="header-section" style="{{ $block['style'] ?? '' }}">
                                    @if (isset($block['logo']))
                                        <img src="{{ $block['logo'] }}" alt="{{ $block['alt'] ?? '' }}" class="logo-img">
                                    @endif
                                    <h1 class="app-name">{{ $block['title'] ?? config('app.name') }}</h1>
                                </div>
                            @break

                            @case('heading')
                                @php
                                    $level = $block['level'] ?? 2;
                                    $level = in_array($level, [1, 2, 3, 4, 5, 6]) ? $level : 2;
                                @endphp
                                <h{{ $level }} class="heading heading-{{ $level }}"
                                    style="{{ $block['style'] ?? '' }}">
                                    {{ $block['content'] ?? '' }}
                                    </h{{ $level }}>
                                @break

                                @case('text')
                                    <p class="text-p" style="{{ $block['style'] ?? '' }}">
                                        {!! nl2br(e($block['content'] ?? '')) !!}
                                    </p>
                                @break

                                @case('button')
                                    <div class="btn-container btn-{{ $block['align'] ?? 'center' }}">
                                        <a href="{{ $block['url'] ?? '#' }}" class="btn"
                                            style="{{ $block['style'] ?? '' }}"
                                            @if (isset($block['attributes']) && is_array($block['attributes'])) @foreach ($block['attributes'] as $key => $value)
                                               {{ $key }}="{{ $value }}"
                                           @endforeach @endif>
                                            {{ $block['label'] ?? 'Click Here' }}
                                        </a>
                                    </div>
                                @break

                                @case('image')
                                    <div class="img-container">
                                        @if (isset($block['url']))
                                            <img src="{{ $block['url'] }}" alt="{{ $block['alt'] ?? '' }}"
                                                class="img-responsive" style="{{ $block['style'] ?? '' }}">
                                        @endif
                                    </div>
                                @break

                                @case('divider')
                                    <hr class="divider" style="{{ $block['style'] ?? '' }}">
                                @break

                                @case('spacer')
                                    <div style="height: {{ $block['height'] ?? '24px' }}; {{ $block['style'] ?? '' }}">
                                    </div>
                                @break

                                @case('footer')
                                    <div class="footer-section" style="{{ $block['style'] ?? '' }}">
                                        {!! $block['content'] ?? '&copy; ' . date('Y') . ' ' . config('app.name') !!}
                                    </div>
                                @break
                            @endswitch
                    @endforeach
                @endif

                {{-- Default Footer --}}
                @if (!($hide_footer ?? false) && !$has_footer)
                    <div class="footer-section">
                        &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
                    </div>
                @endif
            </td>
        </tr>
    </table>

    @if ($automated ?? false)
        <div class="meta-footer">
            This is an automated message from {{ config('app.name') }}.
        </div>
    @endif
</body>

</html>
