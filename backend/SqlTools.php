<?php
namespace App;
use Exception;

/**
 * SQL dump generation and SQL script splitting for the MySQL export/import features.
 */
class SqlTools {
    /**
     * Split a SQL script into executable statements. Understands quoted strings (' " `),
     * backslash escapes, -- / # / block comments and ';' terminators. Comment-only
     * fragments are dropped. DELIMITER blocks (stored routines/triggers) are not supported.
     */
    public static function splitStatements(string $sql): array {
        if (strncmp($sql, "\xEF\xBB\xBF", 3) === 0) {
            $sql = substr($sql, 3);
        }
        $statements = [];
        $buf = '';
        $hasCode = false;
        $len = strlen($sql);
        $quote = null;
        for ($i = 0; $i < $len; $i++) {
            $c = $sql[$i];
            if ($quote !== null) {
                $buf .= $c;
                if ($c === '\\' && $quote !== '`' && $i + 1 < $len) {
                    $buf .= $sql[++$i];
                } elseif ($c === $quote) {
                    $quote = null;
                }
                continue;
            }
            if ($c === "'" || $c === '"' || $c === '`') {
                $quote = $c;
                $hasCode = true;
                $buf .= $c;
                continue;
            }
            $next = $i + 1 < $len ? $sql[$i + 1] : '';
            if ($c === '#' || ($c === '-' && $next === '-' && ($i + 2 >= $len || ctype_space($sql[$i + 2]) || ord($sql[$i + 2]) < 32))) {
                $end = strpos($sql, "\n", $i);
                $end = $end === false ? $len : $end;
                $buf .= substr($sql, $i, $end - $i);
                $i = $end - 1;
                continue;
            }
            if ($c === '/' && $next === '*') {
                $end = strpos($sql, '*/', $i + 2);
                $end = $end === false ? $len : $end + 2;
                // /*! ... */ conditional comments are executable by MySQL, so keep them as code
                if ($i + 2 < $len && $sql[$i + 2] === '!') {
                    $hasCode = true;
                }
                $buf .= substr($sql, $i, $end - $i);
                $i = $end - 1;
                continue;
            }
            if ($c === ';') {
                if ($hasCode) {
                    $statements[] = trim($buf);
                }
                $buf = '';
                $hasCode = false;
                continue;
            }
            if (!ctype_space($c)) {
                $hasCode = true;
            }
            $buf .= $c;
        }
        if ($hasCode && trim($buf) !== '') {
            $statements[] = trim($buf);
        }
        foreach ($statements as $st) {
            if (preg_match('/^\s*DELIMITER\s/i', $st)) {
                throw new Exception("DELIMITER statements (stored routines/triggers) are not supported in import");
            }
        }
        return $statements;
    }

    /** SQL literal for a value: NULL, number, quoted string, or 0x… hex for non-UTF-8 binary data. */
    public static function valueLiteral(MysqlClient $m, $v): string {
        if ($v === null) return 'NULL';
        if (is_int($v) || is_float($v)) return (string)$v;
        $v = (string)$v;
        if ($v !== '' && !mb_check_encoding($v, 'UTF-8')) {
            return '0x' . bin2hex($v);
        }
        return $m->quote($v);
    }

    public static function quoteIdent(string $id): string {
        return '`' . str_replace('`', '``', $id) . '`';
    }

    /** Stream CREATE TABLE (+ batched INSERTs) for one table to $out. Views are skipped. */
    public static function dumpTable(MysqlClient $m, string $table, callable $out, bool $withData = true): void {
        $create = $m->showCreateTable($table);
        if ($create === null) return;
        $q = self::quoteIdent($table);
        $out("--\n-- Table structure for $q\n--\n\nDROP TABLE IF EXISTS $q;\n$create;\n\n");
        if (!$withData) return;
        $out("--\n-- Data for $q\n--\n\n");
        $cols = null;
        $batch = [];
        $size = 0;
        $flush = function () use (&$batch, &$size, &$cols, $out, $q) {
            if (!$batch) return;
            $out("INSERT INTO $q ($cols) VALUES\n" . implode(",\n", $batch) . ";\n");
            $batch = [];
            $size = 0;
        };
        $m->forEachRow("SELECT * FROM $q", function ($row) use (&$batch, &$size, &$cols, $m, $flush) {
            if ($cols === null) {
                $cols = implode(', ', array_map([self::class, 'quoteIdent'], array_keys($row)));
            }
            $line = '(' . implode(', ', array_map(fn($v) => self::valueLiteral($m, $v), $row)) . ')';
            $batch[] = $line;
            $size += strlen($line);
            if (count($batch) >= 500 || $size > 512 * 1024) $flush();
        });
        $flush();
        $out("\n");
    }
}
